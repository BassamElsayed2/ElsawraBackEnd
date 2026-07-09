"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const admin_users_service_1 = require("../services/admin-users.service");
const dashboard_stats_service_1 = require("../services/dashboard-stats.service");
const roles_service_1 = require("../services/roles.service");
const users_list_service_1 = require("../services/users-list.service");
const validation_1 = require("../utils/validation");
class AdminController {
}
exports.AdminController = AdminController;
_a = AdminController;
AdminController.getAdminProfile = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    if (!req.user) {
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    }
    const result = await database_1.pool.request().input("userId", req.user.id).query(`
        SELECT
          id, id as user_id, full_name, role,
          image_url, job_title, address, about,
          email, phone,
          created_at as joined_at, updated_at
        FROM dashboard_users
        WHERE id = @userId
      `);
    if (result.recordset.length === 0) {
        throw new error_middleware_1.ApiError(404, "Admin profile not found");
    }
    const profile = result.recordset[0];
    const permissions = await roles_service_1.RolesService.getPermissionsForAdminRole(profile.role);
    res.json({
        success: true,
        data: {
            profile: { ...profile, permissions },
        },
    });
});
AdminController.updateAdminProfile = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    if (!req.user) {
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    }
    const { full_name, phone, image_url, job_title, address, about } = req.body;
    const checkResult = await database_1.pool
        .request()
        .input("userId", req.user.id)
        .query("SELECT id FROM dashboard_users WHERE id = @userId");
    if (checkResult.recordset.length === 0) {
        throw new error_middleware_1.ApiError(404, "Admin profile not found");
    }
    const updates = [];
    const request = database_1.pool.request().input("userId", req.user.id);
    if (full_name !== undefined) {
        updates.push("full_name = @full_name");
        request.input("full_name", full_name);
    }
    if (phone !== undefined) {
        updates.push("phone = @phone");
        request.input("phone", (0, validation_1.normalizePhone)(phone));
    }
    if (image_url !== undefined) {
        updates.push("image_url = @image_url");
        request.input("image_url", image_url);
    }
    if (job_title !== undefined) {
        updates.push("job_title = @job_title");
        request.input("job_title", job_title);
    }
    if (address !== undefined) {
        updates.push("address = @address");
        request.input("address", address);
    }
    if (about !== undefined) {
        updates.push("about = @about");
        request.input("about", about);
    }
    if (updates.length === 0) {
        throw new error_middleware_1.ApiError(400, "No updates provided");
    }
    updates.push("updated_at = GETDATE()");
    await request.query(`
        UPDATE dashboard_users
        SET ${updates.join(", ")}
        WHERE id = @userId
      `);
    const updatedResult = await database_1.pool.request().input("userId", req.user.id)
        .query(`
        SELECT
          id, id as user_id, full_name, role,
          image_url, job_title, address, about,
          email, phone,
          created_at as joined_at, updated_at
        FROM dashboard_users
        WHERE id = @userId
      `);
    res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
            profile: updatedResult.recordset[0],
        },
    });
});
AdminController.getAllAdmins = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    const { page, limit, search } = req.query;
    const result = await users_list_service_1.UsersListService.getAdmins({ page, limit, search });
    res.json({
        success: true,
        data: {
            admins: result.items,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        },
    });
});
AdminController.getAllUsers = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    const { page, limit, search } = req.query;
    const result = await users_list_service_1.UsersListService.getCustomers({ page, limit, search });
    res.json({
        success: true,
        data: {
            users: result.items,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        },
    });
});
AdminController.getUsersTotals = (0, error_middleware_1.asyncHandler)(async (_req, res, _next) => {
    const totals = await users_list_service_1.UsersListService.getTotals();
    res.json({
        success: true,
        data: totals,
    });
});
AdminController.getDashboardStats = (0, error_middleware_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await dashboard_stats_service_1.DashboardStatsService.getDashboardStats();
    res.json({
        success: true,
        data: stats,
    });
});
AdminController.checkPhoneForNewAdmin = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    const { phone } = req.query;
    if (!phone || typeof phone !== "string") {
        throw new error_middleware_1.ApiError(400, "Phone number is required");
    }
    const result = await admin_users_service_1.AdminUsersService.checkPhoneAvailable(phone);
    res.json({
        success: true,
        exists: result.exists,
        message: result.message,
    });
});
AdminController.createAdmin = (0, error_middleware_1.asyncHandler)(async (req, res, _next) => {
    const user = await admin_users_service_1.AdminUsersService.createAdminUser(req.body);
    res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        data: { user },
    });
});
//# sourceMappingURL=admin.controller.js.map