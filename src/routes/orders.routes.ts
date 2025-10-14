import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
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
  authMiddleware,
  adminMiddleware,
  validateQuery(getOrderStatsQuerySchema),
  OrdersController.getOrderStats
);

// User routes
router.get(
  "/",
  authMiddleware,
  validateQuery(getOrdersQuerySchema),
  OrdersController.getUserOrders
);
router.get(
  "/:id",
  authMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.getOrderById
);
router.post(
  "/",
  authMiddleware,
  ordersLimiter,
  validateBody(createOrderSchema),
  OrdersController.createOrder
);
router.put(
  "/:id/cancel",
  authMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.cancelOrder
);
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  validateQuery(getOrdersQuerySchema),
  OrdersController.getAllOrders
);
router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  OrdersController.getOrderByIdAdmin
);
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateOrderStatusSchema),
  OrdersController.updateOrderStatus
);

export default router;
