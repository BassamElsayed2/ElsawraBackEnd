"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setup_controller_1 = require("../controllers/setup.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Admin routes only
router.post("/pending-orders", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, setup_controller_1.SetupController.setupPendingOrders);
router.get("/status", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, setup_controller_1.SetupController.checkSystemStatus);
exports.default = router;
//# sourceMappingURL=setup.routes.js.map