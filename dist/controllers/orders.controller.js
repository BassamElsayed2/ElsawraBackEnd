"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const orders_service_1 = require("../services/orders.service");
const error_middleware_1 = require("../middleware/error.middleware");
class OrdersController {
}
exports.OrdersController = OrdersController;
_a = OrdersController;
// Get user orders
OrdersController.getUserOrders = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
    }
    const { page, limit } = req.query;
    const result = await orders_service_1.OrdersService.getUserOrders(req.user.id, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({
        success: true,
        data: result,
    });
});
// Get order by ID
OrdersController.getOrderById = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const order = await orders_service_1.OrdersService.getOrderById(id, userId);
    res.json({
        success: true,
        data: { order },
    });
});
// Create order
OrdersController.createOrder = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
    }
    // Check if user has phone number (required for orders)
    const userProfile = await orders_service_1.OrdersService.getUserProfile(req.user.id);
    if (!userProfile.phone) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required to place an order",
            error: "PHONE_REQUIRED",
            messageAr: "رقم الهاتف مطلوب لإتمام الطلب",
        });
    }
    const order = await orders_service_1.OrdersService.createOrder(req.user.id, req.body);
    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order },
    });
});
// Cancel order
OrdersController.cancelOrder = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
    }
    const { id } = req.params;
    const order = await orders_service_1.OrdersService.cancelOrder(id, req.user.id);
    res.json({
        success: true,
        message: "Order cancelled successfully",
        data: { order },
    });
});
// Update order status (admin)
OrdersController.updateOrderStatus = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = await orders_service_1.OrdersService.updateOrderStatus(id, status);
    res.json({
        success: true,
        message: "Order status updated successfully",
        data: { order },
    });
});
// Mark order as paid (user)
OrdersController.markOrderAsPaid = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
    }
    const { id } = req.params;
    const order = await orders_service_1.OrdersService.markOrderAsPaid(id, req.user.id);
    res.json({
        success: true,
        message: "Order marked as paid successfully",
        data: { order },
    });
});
// Get all orders (admin)
OrdersController.getAllOrders = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { page, limit, status, order_id, customer_name } = req.query;
    const result = await orders_service_1.OrdersService.getAllOrders(parseInt(page) || 1, parseInt(limit) || 10, status, order_id, customer_name);
    console.log("📦 Orders Result:", {
        totalOrders: result.orders.length,
        total: result.total,
        searchedOrderId: order_id,
        searchedCustomerName: customer_name,
        status: status || "all",
    });
    res.json({
        success: true,
        data: result,
    });
});
// Debug orders by status
OrdersController.debugOrdersByStatus = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { status } = req.query;
    console.log("🔍 Debug Orders by Status:", status);
    const result = await orders_service_1.OrdersService.getAllOrders(1, 100, // Get more orders for debugging
    status, undefined);
    console.log("🔍 Debug Result:", {
        status: status || "all",
        totalOrders: result.orders.length,
        total: result.total,
        orders: result.orders.map((o) => ({
            id: o.id,
            status: o.status,
            payment_status: o.payment_status,
            payment_method: o.payment_method,
            total: o.total,
            created_at: o.created_at,
        })),
    });
    res.json({
        success: true,
        message: `Debug orders for status: ${status || "all"}`,
        data: {
            status: status || "all",
            totalOrders: result.orders.length,
            total: result.total,
            orders: result.orders.map((o) => ({
                id: o.id,
                status: o.status,
                payment_status: o.payment_status,
                payment_method: o.payment_method,
                total: o.total,
                created_at: o.created_at,
            })),
        },
    });
});
// Get order by ID (admin - no user restriction)
OrdersController.getOrderByIdAdmin = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    // Don't pass userId to allow admin to see any order
    const order = await orders_service_1.OrdersService.getOrderById(id);
    res.json({
        success: true,
        data: { order },
    });
});
// Get order statistics (admin)
OrdersController.getOrderStats = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { start_date, end_date, branch_id } = req.query;
    const stats = await orders_service_1.OrdersService.getOrderStats({
        start_date,
        end_date,
        branch_id,
    });
    res.json({
        success: true,
        data: { stats },
    });
});
// Delete order (admin only)
OrdersController.deleteOrder = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const result = await orders_service_1.OrdersService.deleteOrder(id);
    res.json({
        success: true,
        data: result,
    });
});
//# sourceMappingURL=orders.controller.js.map