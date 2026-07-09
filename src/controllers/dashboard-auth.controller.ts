import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { DashboardAuthService } from "../services/dashboard-auth.service";
import { asyncHandler } from "../middleware/error.middleware";
import {
  getSessionCookieOptions,
  getClearSessionCookieOptions,
} from "../config/auth";

export class DashboardAuthController {
  static signIn = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const result = await DashboardAuthService.signIn(req.body, req);

      res.cookie("dashboard_session", result.token, getSessionCookieOptions());

      res.json({
        success: true,
        message: "Logged in successfully",
        data: { user: result.user },
      });
    },
  );

  static signOut = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const token = req.cookies["dashboard_session"];

      if (req.user && token) {
        await DashboardAuthService.signOut(req.user.id, token, req);
      }

      res.clearCookie("dashboard_session", getClearSessionCookieOptions());

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    },
  );

  static getMe = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const user = await DashboardAuthService.getCurrentUser(req.user.id);

      res.json({
        success: true,
        data: { user },
      });
    },
  );

  static updateProfile = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      await DashboardAuthService.updateProfile(req.user.id, req.body);

      res.json({
        success: true,
        message: "Profile updated successfully",
      });
    },
  );

  static changePassword = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const { old_password, new_password } = req.body;
      await DashboardAuthService.changePassword(
        req.user.id,
        old_password,
        new_password,
        req,
      );

      res.clearCookie("dashboard_session", getClearSessionCookieOptions());

      res.json({
        success: true,
        message: "Password changed successfully. Please login again.",
      });
    },
  );
}
