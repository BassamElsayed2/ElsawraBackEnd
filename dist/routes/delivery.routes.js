"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delivery_controller_1 = require("../controllers/delivery.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Coordinate schema
const coordinatesSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
// Get nearest branch (public)
router.post("/nearest-branch", (0, validation_middleware_1.validateBody)(coordinatesSchema), delivery_controller_1.DeliveryController.getNearestBranch);
// Calculate delivery fee (public)
router.post("/calculate-fee", (0, validation_middleware_1.validateBody)(coordinatesSchema), delivery_controller_1.DeliveryController.calculateDeliveryFee);
exports.default = router;
//# sourceMappingURL=delivery.routes.js.map