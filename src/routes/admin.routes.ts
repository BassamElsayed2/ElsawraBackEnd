import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { RolesController } from "../controllers/roles.controller";
import { UserManagementController } from "../controllers/user-management.controller";
import {
  dashboardAuthMiddleware,
  requirePermission,
} from "../middleware/auth.middleware";

const router = Router();

router.use(dashboardAuthMiddleware);

// Profile
router.get("/profile", AdminController.getAdminProfile);
router.put("/profile", AdminController.updateAdminProfile);

// Admin provisioning
router.get("/admins/check-phone", AdminController.checkPhoneForNewAdmin);
router.post(
  "/admins",
  requirePermission("users:manage"),
  AdminController.createAdmin,
);

// Customer user management
router.patch(
  "/users/:userId/status",
  requirePermission("users:manage"),
  UserManagementController.setCustomerStatus,
);
router.delete(
  "/users/:userId",
  requirePermission("users:manage"),
  UserManagementController.deleteCustomer,
);

// Dashboard admin management
router.patch(
  "/admins/:adminId/status",
  requirePermission("users:manage"),
  UserManagementController.setDashboardUserStatus,
);
router.delete(
  "/admins/:adminId",
  requirePermission("users:manage"),
  UserManagementController.deleteDashboardUser,
);
router.patch(
  "/admins/:adminId/role",
  requirePermission("users:manage"),
  UserManagementController.updateAdminRole,
);

// Roles & permissions
router.get(
  "/permissions",
  requirePermission("roles:read"),
  RolesController.getPermissionsCatalog,
);
router.get(
  "/roles",
  requirePermission("roles:read"),
  RolesController.getAllRoles,
);
router.post(
  "/roles",
  requirePermission("roles:manage"),
  RolesController.createRole,
);
router.put(
  "/roles/:id",
  requirePermission("roles:manage"),
  RolesController.updateRole,
);
router.delete(
  "/roles/:id",
  requirePermission("roles:manage"),
  RolesController.deleteRole,
);

// Lists
router.get(
  "/all",
  requirePermission("users:read"),
  AdminController.getAllAdmins,
);
router.get(
  "/users",
  requirePermission("users:read"),
  AdminController.getAllUsers,
);
router.get("/dashboard-stats", AdminController.getDashboardStats);

export default router;
