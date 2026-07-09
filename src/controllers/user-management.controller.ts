import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { asyncHandler } from "../middleware/error.middleware";
import { UserManagementService } from "../services/user-management.service";

export class UserManagementController {
  static setCustomerStatus = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { userId } = req.params;
      const { is_active } = req.body;

      const result = await UserManagementService.setCustomerStatus(
        userId,
        Boolean(is_active),
        req.user!.id
      );

      res.json({
        success: true,
        message: is_active
          ? "User activated successfully"
          : "User disabled successfully",
        data: result,
      });
    }
  );

  static setDashboardUserStatus = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { adminId } = req.params;
      const { is_active } = req.body;

      const result = await UserManagementService.setDashboardUserStatus(
        adminId,
        Boolean(is_active),
        req.user!.id
      );

      res.json({
        success: true,
        message: is_active
          ? "Admin activated successfully"
          : "Admin disabled successfully",
        data: result,
      });
    }
  );

  static deleteCustomer = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { userId } = req.params;

      await UserManagementService.deleteCustomer(userId, req.user!.id);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    }
  );

  static deleteDashboardUser = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { adminId } = req.params;

      await UserManagementService.deleteDashboardUser(adminId, req.user!.id);

      res.json({
        success: true,
        message: "Admin deleted successfully",
      });
    }
  );

  static updateAdminRole = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { adminId } = req.params;
      const { role } = req.body;

      await UserManagementService.updateAdminRole(
        adminId,
        role,
        req.user!.id
      );

      res.json({
        success: true,
        message: "Admin role updated successfully",
      });
    }
  );
}
