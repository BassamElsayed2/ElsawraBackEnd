"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("../controllers/orders.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const orders_validators_1 = require("../validators/orders.validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Admin routes (must come before dynamic :id routes)
router.get("/stats", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateQuery)(orders_validators_1.getOrderStatsQuerySchema), orders_controller_1.OrdersController.getOrderStats);
// User routes
router.get("/", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateQuery)(orders_validators_1.getOrdersQuerySchema), orders_controller_1.OrdersController.getUserOrders);
router.get("/:id", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), orders_controller_1.OrdersController.getOrderById);
router.post("/", auth_middleware_1.authMiddleware, rate_limit_middleware_1.ordersLimiter, (0, validation_middleware_1.validateBody)(orders_validators_1.createOrderSchema), orders_controller_1.OrdersController.createOrder);
router.put("/:id/cancel", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), orders_controller_1.OrdersController.cancelOrder);
router.get("/admin/all", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateQuery)(orders_validators_1.getOrdersQuerySchema), orders_controller_1.OrdersController.getAllOrders);
router.get("/admin/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), orders_controller_1.OrdersController.getOrderByIdAdmin);
router.put("/:id/status", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(orders_validators_1.updateOrderStatusSchema), orders_controller_1.OrdersController.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=orders.routes.js.map