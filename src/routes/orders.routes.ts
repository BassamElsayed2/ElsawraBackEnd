import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { customerAuthMiddleware, dashboardAuthMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validation.middleware";
import { ordersLimiter } from "../middleware/rate-limit.middleware";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema,
  getOrderStatsQuerySchema,
} from "../validators/orders.validators";
import { z } from "zod";

const router = Router();

// Admin routes (must come before dynamic :id routes)
router.get(
  "/stats",
  dashboardAuthMiddleware,
  validateQuery(getOrderStatsQuerySchema),
  OrdersController.getOrderStats
);

// User routes
router.get(
  "/",
  customerAuthMiddleware,
  validateQuery(getOrdersQuerySchema),
  OrdersController.getUserOrders
);
router.get(
  "/:id",
  customerAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.getOrderById
);
router.post(
  "/",
  customerAuthMiddleware,
  ordersLimiter,
  validateBody(createOrderSchema),
  OrdersController.createOrder
);
router.put(
  "/:id/cancel",
  customerAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.cancelOrder
);
router.put(
  "/:id/mark-paid",
  customerAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.markOrderAsPaid
);
router.get(
  "/admin/all",
  dashboardAuthMiddleware,
  validateQuery(getOrdersQuerySchema),
  OrdersController.getAllOrders
);
router.get(
  "/admin/:id",
  dashboardAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.getOrderByIdAdmin
);
router.put(
  "/:id/status",
  dashboardAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateOrderStatusSchema),
  OrdersController.updateOrderStatus
);

// Delete order (admin only)
router.delete(
  "/:id",
  dashboardAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.deleteOrder
);

export default router;
