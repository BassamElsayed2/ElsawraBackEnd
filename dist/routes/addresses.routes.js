"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addresses_controller_1 = require("../controllers/addresses.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Address schemas
const createAddressSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    street: zod_1.z.string().min(1, "Street is required"),
    building: zod_1.z.string().optional(),
    floor: zod_1.z.string().optional(),
    apartment: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, "City is required"),
    area: zod_1.z.string().min(1, "Area is required"),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    notes: zod_1.z.string().optional(),
    is_default: zod_1.z.boolean().optional(),
});
const updateAddressSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    street: zod_1.z.string().min(1).optional(),
    building: zod_1.z.string().optional(),
    floor: zod_1.z.string().optional(),
    apartment: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1).optional(),
    area: zod_1.z.string().min(1).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    notes: zod_1.z.string().optional(),
    is_default: zod_1.z.boolean().optional(),
});
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Get user addresses
router.get("/", addresses_controller_1.AddressesController.getUserAddresses);
// Create address
router.post("/", (0, validation_middleware_1.validateBody)(createAddressSchema), addresses_controller_1.AddressesController.createAddress);
// Update address
router.put("/:id", (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(updateAddressSchema), addresses_controller_1.AddressesController.updateAddress);
// Delete address
router.delete("/:id", (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), addresses_controller_1.AddressesController.deleteAddress);
// Set default address
router.patch("/:id/default", (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), addresses_controller_1.AddressesController.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=addresses.routes.js.map