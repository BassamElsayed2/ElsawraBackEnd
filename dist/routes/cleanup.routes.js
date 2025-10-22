"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cleanup_controller_1 = require("../controllers/cleanup.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Admin routes only
router.post("/expired-pending-orders", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, cleanup_controller_1.CleanupController.cleanupExpiredPendingOrders);
router.get("/stats", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, cleanup_controller_1.CleanupController.getCleanupStats);
exports.default = router;
//# sourceMappingURL=cleanup.routes.js.map