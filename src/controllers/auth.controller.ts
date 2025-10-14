import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/error.middleware";

export class AuthController {
  // Sign up
  static signUp = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const result = await AuthService.signUp(req.body, req);

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: result,
      });
    }
  );

  // Sign in
  static signIn = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const result = await AuthService.signIn(req.body, req);

      // Set httpOnly cookie
      res.cookie("food_cms_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: "Logged in successfully",
        data: {
          user: result.user,
        },
      });
    }
  );

  // Sign out
  static signOut = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const token = req.cookies["food_cms_session"];

      if (req.user && token) {
        await AuthService.signOut(req.user.id, token, req);
      }

      // Clear cookie
      res.clearCookie("food_cms_session");

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    }
  );

  // Get current user (me)
  static getMe = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const user = await AuthService.getCurrentUser(req.user.id);

      res.json({
        success: true,
        data: { user },
      });
    }
  );

  // Update profile
  static updateProfile = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      await AuthService.updateProfile(req.user.id, req.body);

      res.json({
        success: true,
        message: "Profile updated successfully",
      });
    }
  );

  // Change password
  static changePassword = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const { old_password, new_password } = req.body;
      await AuthService.changePassword(
        req.user.id,
        old_password,
        new_password,
        req
      );

      // Clear all cookies
      res.clearCookie("food_cms_session");

      res.json({
        success: true,
        message: "Password changed successfully. Please login again.",
      });
    }
  );

  // Check if phone exists
  static checkPhoneExists = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { phone } = req.body;
      const exists = await AuthService.checkPhoneExists(phone);

      res.json({
        success: true,
        data: { exists },
      });
    }
  );
}
