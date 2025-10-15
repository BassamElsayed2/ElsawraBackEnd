"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryController = void 0;
const delivery_service_1 = require("../services/delivery.service");
const error_middleware_1 = require("../middleware/error.middleware");
class DeliveryController {
}
exports.DeliveryController = DeliveryController;
_a = DeliveryController;
// Calculate delivery fee
DeliveryController.calculateDeliveryFee = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { user_latitude, user_longitude, branch_id } = req.body;
    const result = await delivery_service_1.DeliveryService.calculateDeliveryFee({
        user_latitude,
        user_longitude,
        branch_id,
    });
    res.json({
        success: true,
        data: result,
    });
});
// Get all delivery fee configurations (admin)
DeliveryController.getDeliveryFeeConfigs = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const configs = await delivery_service_1.DeliveryService.getDeliveryFeeConfigs();
    res.json({
        success: true,
        data: { configs },
    });
});
// Create delivery fee configuration (admin)
DeliveryController.createDeliveryFeeConfig = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const config = await delivery_service_1.DeliveryService.createDeliveryFeeConfig(req.body);
    res.status(201).json({
        success: true,
        message: "Delivery fee configuration created successfully",
        data: { config },
    });
});
// Update delivery fee configuration (admin)
DeliveryController.updateDeliveryFeeConfig = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    // Log the received data for debugging
    console.log("Update delivery fee config request:", {
        id,
        body: req.body,
        bodyType: typeof req.body,
        keys: Object.keys(req.body),
    });
    const config = await delivery_service_1.DeliveryService.updateDeliveryFeeConfig(id, req.body);
    res.json({
        success: true,
        message: "Delivery fee configuration updated successfully",
        data: { config },
    });
});
// Delete delivery fee configuration (admin)
DeliveryController.deleteDeliveryFeeConfig = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    await delivery_service_1.DeliveryService.deleteDeliveryFeeConfig(id);
    res.json({
        success: true,
        message: "Delivery fee configuration deleted successfully",
    });
});
//# sourceMappingURL=delivery.controller.js.map