"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const mssql_1 = __importDefault(require("mssql"));
class OrdersService {
    // Get user orders
    static async getUserOrders(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const ordersResult = await database_1.pool
            .request()
            .input("userId", userId)
            .input("offset", offset)
            .input("limit", limit).query(`
        SELECT 
          o.*,
          a.title as address_name, a.area, a.city,
          b.name_ar as branch_name_ar, b.name_en as branch_name_en
        FROM orders o
        LEFT JOIN addresses a ON o.address_id = a.id
        LEFT JOIN branches b ON o.branch_id = b.id
        WHERE o.user_id = @userId
        ORDER BY o.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
        const orders = ordersResult.recordset.map((order) => ({
            ...order,
            items: JSON.parse(order.items),
        }));
        // Get total count
        const countResult = await database_1.pool
            .request()
            .input("userId", userId)
            .query("SELECT COUNT(*) as total FROM orders WHERE user_id = @userId");
        const total = countResult.recordset[0].total;
        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Get order by ID
    static async getOrderById(orderId, userId) {
        const request = database_1.pool.request().input("orderId", orderId);
        let userCondition = "";
        if (userId) {
            userCondition = "AND o.user_id = @userId";
            request.input("userId", userId);
        }
        const result = await request.query(`
      SELECT 
        o.*,
        p.full_name as customer_name, p.phone as customer_phone,
        a.title as address_name, a.street, a.building, a.floor, a.apartment, a.area, a.city, a.latitude, a.longitude, a.notes as address_notes,
        b.name_ar as branch_name_ar, b.name_en as branch_name_en, b.address_ar as branch_address_ar, b.address_en as branch_address_en, b.phone as branch_phone
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.user_id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE o.id = @orderId ${userCondition}
    `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "Order not found");
        }
        const order = result.recordset[0];
        order.items = JSON.parse(order.items);
        return order;
    }
    // Create order
    static async createOrder(userId, data) {
        // Validate delivery type
        if (data.delivery_type === "delivery" && !data.address_id) {
            throw new error_middleware_1.ApiError(400, "Address is required for delivery orders");
        }
        if (data.delivery_type === "pickup" && !data.branch_id) {
            throw new error_middleware_1.ApiError(400, "Branch is required for pickup orders");
        }
        // Create order using stored procedure
        const result = await database_1.pool
            .request()
            .input("user_id", mssql_1.default.UniqueIdentifier, userId)
            .input("address_id", mssql_1.default.UniqueIdentifier, data.address_id || null)
            .input("delivery_type", mssql_1.default.NVarChar(20), data.delivery_type)
            .input("branch_id", mssql_1.default.UniqueIdentifier, data.branch_id || null)
            .input("items", mssql_1.default.NVarChar(mssql_1.default.MAX), JSON.stringify(data.items))
            .input("subtotal", mssql_1.default.Decimal(10, 2), data.subtotal)
            .input("delivery_fee", mssql_1.default.Decimal(10, 2), data.delivery_fee)
            .input("total", mssql_1.default.Decimal(10, 2), data.total)
            .input("notes", mssql_1.default.NVarChar(mssql_1.default.MAX), data.notes || null)
            .input("payment_method", mssql_1.default.NVarChar(50), data.payment_method || "cash")
            .output("order_id", mssql_1.default.UniqueIdentifier)
            .execute("sp_CreateOrder");
        const orderId = result.output.order_id;
        return await this.getOrderById(orderId);
    }
    // Update order status (admin only)
    static async updateOrderStatus(orderId, status) {
        await database_1.pool
            .request()
            .input("order_id", mssql_1.default.UniqueIdentifier, orderId)
            .input("status", mssql_1.default.NVarChar(20), status)
            .execute("sp_UpdateOrderStatus");
        return await this.getOrderById(orderId);
    }
    // Cancel order (user)
    static async cancelOrder(orderId, userId) {
        // Check if order belongs to user
        const checkResult = await database_1.pool
            .request()
            .input("orderId", orderId)
            .input("userId", userId)
            .query("SELECT id, status FROM orders WHERE id = @orderId AND user_id = @userId");
        if (checkResult.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "Order not found");
        }
        const order = checkResult.recordset[0];
        // Only allow cancellation if order is pending or confirmed
        if (!["pending", "confirmed"].includes(order.status)) {
            throw new error_middleware_1.ApiError(400, "Order cannot be cancelled at this stage");
        }
        await database_1.pool
            .request()
            .input("order_id", mssql_1.default.UniqueIdentifier, orderId)
            .input("status", mssql_1.default.NVarChar(20), "cancelled")
            .execute("sp_UpdateOrderStatus");
        return await this.getOrderById(orderId, userId);
    }
    // Get all orders (admin)
    static async getAllOrders(page = 1, limit = 10, status, orderId) {
        const offset = (page - 1) * limit;
        const request = database_1.pool
            .request()
            .input("offset", offset)
            .input("limit", limit);
        const conditions = [];
        if (status) {
            conditions.push("o.status = @status");
            request.input("status", status);
        }
        if (orderId) {
            conditions.push("CAST(o.id AS NVARCHAR(36)) LIKE @orderId");
            request.input("orderId", `%${orderId}%`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const ordersResult = await request.query(`
      SELECT 
        o.*,
        p.full_name as customer_name, p.phone as customer_phone,
        a.area, a.city,
        b.name_ar as branch_name_ar, b.name_en as branch_name_en
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.user_id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN branches b ON o.branch_id = b.id
      ${whereClause}
      ORDER BY o.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);
        const orders = ordersResult.recordset.map((order) => ({
            ...order,
            items: JSON.parse(order.items),
        }));
        // Get total count
        const countRequest = database_1.pool.request();
        if (status) {
            countRequest.input("status", status);
        }
        if (orderId) {
            countRequest.input("orderId", `%${orderId}%`);
        }
        // Reconstruct where clause for count query
        const countConditions = [];
        if (status) {
            countConditions.push("o.status = @status");
        }
        if (orderId) {
            countConditions.push("CAST(o.id AS NVARCHAR(36)) LIKE @orderId");
        }
        const countWhereClause = countConditions.length > 0
            ? `WHERE ${countConditions.join(" AND ")}`
            : "";
        const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM orders o ${countWhereClause}
    `);
        const total = countResult.recordset[0].total;
        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Get order statistics (admin)
    static async getOrderStats(filters) {
        const request = database_1.pool.request();
        let conditions = [];
        if (filters?.start_date) {
            conditions.push("o.created_at >= @startDate");
            request.input("startDate", filters.start_date);
        }
        if (filters?.end_date) {
            conditions.push("o.created_at <= @endDate");
            request.input("endDate", filters.end_date);
        }
        if (filters?.branch_id) {
            conditions.push("o.branch_id = @branchId");
            request.input("branchId", filters.branch_id);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const result = await request.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN o.status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
        SUM(CASE WHEN o.status = 'ready' THEN 1 ELSE 0 END) as ready_orders,
        SUM(CASE WHEN o.status = 'delivering' THEN 1 ELSE 0 END) as delivering_orders,
        SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN o.total ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN o.status IN ('delivered', 'completed') THEN o.total ELSE NULL END), 0) as average_order_value
      FROM orders o
      ${whereClause}
    `);
        return result.recordset[0];
    }
}
exports.OrdersService = OrdersService;
//# sourceMappingURL=orders.service.js.map