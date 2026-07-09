import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { pool } from "../config/database";
import { asyncHandler, ApiError } from "../middleware/error.middleware";
import { AdminUsersService } from "../services/admin-users.service";
import { DashboardStatsService } from "../services/dashboard-stats.service";
import { RolesService } from "../services/roles.service";
import { UsersListService } from "../services/users-list.service";
import { normalizePhone } from "../utils/validation";

export class AdminController {
  static getAdminProfile = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Not authenticated");
      }

      const result = await pool.request().input("userId", req.user.id).query(`
        SELECT
          id, id as user_id, full_name, role,
          image_url, job_title, address, about,
          email, phone,
          created_at as joined_at, updated_at
        FROM dashboard_users
        WHERE id = @userId
      `);

      if (result.recordset.length === 0) {
        throw new ApiError(404, "Admin profile not found");
      }

      const profile = result.recordset[0];
      const permissions = await RolesService.getPermissionsForAdminRole(
        profile.role,
      );

      res.json({
        success: true,
        data: {
          profile: { ...profile, permissions },
        },
      });
    },
  );

  static updateAdminProfile = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Not authenticated");
      }

      const { full_name, phone, image_url, job_title, address, about } =
        req.body;

      const checkResult = await pool
        .request()
        .input("userId", req.user.id)
        .query("SELECT id FROM dashboard_users WHERE id = @userId");

      if (checkResult.recordset.length === 0) {
        throw new ApiError(404, "Admin profile not found");
      }

      const updates: string[] = [];
      const request = pool.request().input("userId", req.user.id);

      if (full_name !== undefined) {
        updates.push("full_name = @full_name");
        request.input("full_name", full_name);
      }

      if (phone !== undefined) {
        updates.push("phone = @phone");
        request.input("phone", normalizePhone(phone));
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
        throw new ApiError(400, "No updates provided");
      }

      updates.push("updated_at = GETDATE()");

      await request.query(`
        UPDATE dashboard_users
        SET ${updates.join(", ")}
        WHERE id = @userId
      `);

      const updatedResult = await pool.request().input("userId", req.user.id)
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
    },
  );

  static getAllAdmins = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { page, limit, search } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
      };

      const result = await UsersListService.getDashboardAdmins(
        parseInt(page || "1", 10) || 1,
        parseInt(limit || "10", 10) || 10,
        { search },
      );

      res.json({
        success: true,
        data: result,
      });
    },
  );

  static getAllUsers = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { page, limit, search } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
      };

      const result = await UsersListService.getCustomers(
        parseInt(page || "1", 10) || 1,
        parseInt(limit || "10", 10) || 10,
        { search },
      );

      res.json({
        success: true,
        data: result,
      });
    },
  );

  static getDashboardStats = asyncHandler(
    async (_req: AuthRequest, res: Response, _next: NextFunction) => {
      const stats = await DashboardStatsService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
      });
    },
  );

  static checkPhoneForNewAdmin = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { phone } = req.query;

      if (!phone || typeof phone !== "string") {
        throw new ApiError(400, "Phone number is required");
      }

      const result = await AdminUsersService.checkPhoneAvailable(phone);

      res.json({
        success: true,
        exists: result.exists,
        message: result.message,
      });
    },
  );

  static createAdmin = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const user = await AdminUsersService.createAdminUser(req.body);

      res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        data: { user },
      });
    },
  );
}
