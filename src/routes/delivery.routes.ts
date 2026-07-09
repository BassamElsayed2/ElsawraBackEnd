import { Router } from "express";
import { DeliveryController } from "../controllers/delivery.controller";
import { customerAuthMiddleware, dashboardAuthMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware";
import { z } from "zod";

const router = Router();

// Calculate delivery fee (authenticated users)
router.post(
  "/calculate-fee",
  customerAuthMiddleware,
  validateBody(
    z.object({
      user_latitude: z.number().min(-90).max(90),
      user_longitude: z.number().min(-180).max(180),
      branch_id: z.string().uuid().optional(),
    })
  ),
  DeliveryController.calculateDeliveryFee
);

// Admin routes for managing delivery fee configurations
router.get(
  "/fee-configs",
  dashboardAuthMiddleware,
  DeliveryController.getDeliveryFeeConfigs
);

router.post(
  "/fee-configs",
  dashboardAuthMiddleware,
  validateBody(
    z.object({
      min_distance_km: z.number().min(0),
      max_distance_km: z.number().positive(),
      fee: z.number().min(0),
    })
  ),
  DeliveryController.createDeliveryFeeConfig
);

router.put(
  "/fee-configs/:id",
  dashboardAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(
    z.object({
      min_distance_km: z.number().min(0).optional(),
      max_distance_km: z.number().positive().optional(),
      fee: z.number().min(0).optional(),
      is_active: z.boolean().optional(),
    })
  ),
  DeliveryController.updateDeliveryFeeConfig
);

router.delete(
  "/fee-configs/:id",
  dashboardAuthMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  DeliveryController.deleteDeliveryFeeConfig
);

export default router;
