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
// Get all orders (admin)
OrdersController.getAllOrders = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { page, limit, status, order_id } = req.query;
    console.log("📋 Orders Query Parameters:", {
        page,
        limit,
        status,
        order_id,
    });
    const result = await orders_service_1.OrdersService.getAllOrders(parseInt(page) || 1, parseInt(limit) || 10, status, order_id);
    console.log("📦 Orders Result:", {
        totalOrders: result.orders.length,
        total: result.total,
        searchedOrderId: order_id,
    });
    res.json({
        success: true,
        data: result,
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
//# sourceMappingURL=orders.controller.js.map