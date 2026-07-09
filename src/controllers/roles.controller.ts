import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { asyncHandler } from "../middleware/error.middleware";
import { RolesService } from "../services/roles.service";
import {
  PERMISSIONS_CATALOG,
  PERMISSION_GROUPS,
} from "../constants/permissions";

export class RolesController {
  static getPermissionsCatalog = asyncHandler(
    async (_req: AuthRequest, res: Response, _next: NextFunction) => {
      res.json({
        success: true,
        data: {
          permissions: PERMISSIONS_CATALOG,
          groups: PERMISSION_GROUPS,
        },
      });
    }
  );

  static getAllRoles = asyncHandler(
    async (_req: AuthRequest, res: Response, _next: NextFunction) => {
      const roles = await RolesService.getAllRoles();
      res.json({ success: true, data: { roles } });
    }
  );

  static createRole = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const role = await RolesService.createRole(req.body);
      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: { role },
      });
    }
  );

  static updateRole = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const role = await RolesService.updateRole(id, req.body);
      res.json({
        success: true,
        message: "Role updated successfully",
        data: { role },
      });
    }
  );

  static deleteRole = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const actorRole = req.adminContext?.role || req.user?.role;
      await RolesService.deleteRole(id, actorRole);
      res.json({
        success: true,
        message: "Role deleted successfully",
      });
    }
  );
}
