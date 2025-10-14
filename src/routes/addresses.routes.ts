import { Router } from "express";
import { AddressesController } from "../controllers/addresses.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware";
import { z } from "zod";

const router = Router();

// Address schemas
const createAddressSchema = z.object({
  title: z.string().min(1, "Title is required"),
  street: z.string().min(1, "Street is required"),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
  is_default: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  title: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
  is_default: z.boolean().optional(),
});

// All routes require authentication
router.use(authMiddleware);

// Get user addresses
router.get("/", AddressesController.getUserAddresses);

// Create address
router.post(
  "/",
  validateBody(createAddressSchema),
  AddressesController.createAddress
);

// Update address
router.put(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateAddressSchema),
  AddressesController.updateAddress
);

// Delete address
router.delete(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  AddressesController.deleteAddress
);

// Set default address
router.patch(
  "/:id/default",
  validateParams(z.object({ id: z.string().uuid() })),
  AddressesController.setDefaultAddress
);

export default router;
