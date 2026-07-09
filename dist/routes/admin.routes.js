"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const roles_controller_1 = require("../controllers/roles.controller");
const user_management_controller_1 = require("../controllers/user-management.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.dashboardAuthMiddleware);
// Profile
router.get("/profile", admin_controller_1.AdminController.getAdminProfile);
router.put("/profile", admin_controller_1.AdminController.updateAdminProfile);
// Admin provisioning
router.get("/admins/check-phone", admin_controller_1.AdminController.checkPhoneForNewAdmin);
router.post("/admins", (0, auth_middleware_1.requirePermission)("users:manage"), admin_controller_1.AdminController.createAdmin);
// Customer user management
router.patch("/users/:userId/status", (0, auth_middleware_1.requirePermission)("users:manage"), user_management_controller_1.UserManagementController.setCustomerStatus);
router.delete("/users/:userId", (0, auth_middleware_1.requirePermission)("users:manage"), user_management_controller_1.UserManagementController.deleteCustomer);
// Dashboard admin management
router.patch("/admins/:adminId/status", (0, auth_middleware_1.requirePermission)("users:manage"), user_management_controller_1.UserManagementController.setDashboardUserStatus);
router.delete("/admins/:adminId", (0, auth_middleware_1.requirePermission)("users:manage"), user_management_controller_1.UserManagementController.deleteDashboardUser);
router.patch("/admins/:adminId/role", (0, auth_middleware_1.requirePermission)("users:manage"), user_management_controller_1.UserManagementController.updateAdminRole);
// Roles & permissions
router.get("/permissions", (0, auth_middleware_1.requirePermission)("roles:read"), roles_controller_1.RolesController.getPermissionsCatalog);
router.get("/roles", (0, auth_middleware_1.requirePermission)("roles:read"), roles_controller_1.RolesController.getAllRoles);
router.post("/roles", (0, auth_middleware_1.requirePermission)("roles:manage"), roles_controller_1.RolesController.createRole);
router.put("/roles/:id", (0, auth_middleware_1.requirePermission)("roles:manage"), roles_controller_1.RolesController.updateRole);
router.delete("/roles/:id", (0, auth_middleware_1.requirePermission)("roles:manage"), roles_controller_1.RolesController.deleteRole);
// Lists
router.get("/totals", (0, auth_middleware_1.requirePermission)("users:read"), admin_controller_1.AdminController.getUsersTotals);
router.get("/all", (0, auth_middleware_1.requirePermission)("users:read"), admin_controller_1.AdminController.getAllAdmins);
router.get("/users", (0, auth_middleware_1.requirePermission)("users:read"), admin_controller_1.AdminController.getAllUsers);
router.get("/dashboard-stats", admin_controller_1.AdminController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map