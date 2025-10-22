"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authMiddleware);
router.use(auth_middleware_1.adminMiddleware);
// Get current admin profile
router.get("/profile", admin_controller_1.AdminController.getAdminProfile);
// Update admin profile
router.put("/profile", admin_controller_1.AdminController.updateAdminProfile);
// Get all admins (super_admin only)
router.get("/all", admin_controller_1.AdminController.getAllAdmins);
// Get all regular users (admin only)
router.get("/users", admin_controller_1.AdminController.getAllUsers);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map