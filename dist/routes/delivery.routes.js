"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delivery_controller_1 = require("../controllers/delivery.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Calculate delivery fee (authenticated users)
router.post("/calculate-fee", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateBody)(zod_1.z.object({
    user_latitude: zod_1.z.number().min(-90).max(90),
    user_longitude: zod_1.z.number().min(-180).max(180),
    branch_id: zod_1.z.string().uuid().optional(),
})), delivery_controller_1.DeliveryController.calculateDeliveryFee);
// Admin routes for managing delivery fee configurations
router.get("/fee-configs", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, delivery_controller_1.DeliveryController.getDeliveryFeeConfigs);
router.post("/fee-configs", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateBody)(zod_1.z.object({
    min_distance_km: zod_1.z.number().min(0),
    max_distance_km: zod_1.z.number().positive(),
    fee: zod_1.z.number().min(0),
})), delivery_controller_1.DeliveryController.createDeliveryFeeConfig);
router.put("/fee-configs/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(zod_1.z.object({
    min_distance_km: zod_1.z.number().min(0).optional(),
    max_distance_km: zod_1.z.number().positive().optional(),
    fee: zod_1.z.number().min(0).optional(),
    is_active: zod_1.z.boolean().optional(),
})), delivery_controller_1.DeliveryController.updateDeliveryFeeConfig);
router.delete("/fee-configs/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), delivery_controller_1.DeliveryController.deleteDeliveryFeeConfig);
exports.default = router;
//# sourceMappingURL=delivery.routes.js.map