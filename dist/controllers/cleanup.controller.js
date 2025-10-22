"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupController = void 0;
const cleanup_service_1 = require("../services/cleanup.service");
const error_middleware_1 = require("../middleware/error.middleware");
class CleanupController {
}
exports.CleanupController = CleanupController;
_a = CleanupController;
/**
 * Clean up expired pending orders (admin only)
 */
CleanupController.cleanupExpiredPendingOrders = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const result = await cleanup_service_1.CleanupService.cleanupExpiredPendingOrders();
    res.json({
        success: true,
        message: "Cleanup completed successfully",
        data: result,
    });
});
/**
 * Get cleanup statistics (admin only)
 */
CleanupController.getCleanupStats = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const stats = await cleanup_service_1.CleanupService.getCleanupStats();
    res.json({
        success: true,
        data: stats,
    });
});
//# sourceMappingURL=cleanup.controller.js.map