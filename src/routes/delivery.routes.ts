import { Router } from "express";
import { DeliveryController } from "../controllers/delivery.controller";
import { validateBody } from "../middleware/validation.middleware";
import { z } from "zod";

const router = Router();

// Coordinate schema
const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Get nearest branch (public)
router.post(
  "/nearest-branch",
  validateBody(coordinatesSchema),
  DeliveryController.getNearestBranch
);

// Calculate delivery fee (public)
router.post(
  "/calculate-fee",
  validateBody(coordinatesSchema),
  DeliveryController.calculateDeliveryFee
);

export default router;
