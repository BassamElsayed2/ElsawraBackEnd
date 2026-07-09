import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";
import { AuthRequest } from "../types";
import { ApiError } from "./error.middleware";
import { RolesService } from "../services/roles.service";

export type AccountType = "dashboard" | "customer";

interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  accountType?: AccountType;
}

export interface AdminContext {
  role: string;
  permissions: string[];
}

async function loadDashboardContext(userId: string): Promise<AdminContext | null> {
  const result = await pool.request().input("userId", userId).query(`
    SELECT role FROM dashboard_users WHERE id = @userId
  `);

  if (result.recordset.length === 0) return null;

  const role = result.recordset[0].role as string;
  const permissions = await RolesService.getPermissionsForAdminRole(role);

  return { role, permissions };
}

export function hasPermission(
  context: AdminContext,
  required: string | string[]
): boolean {
  if (context.role === "super_admin") return true;

  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((p) => context.permissions.includes(p));
}

function verifyTokenPayload(
  decoded: JWTPayload,
  expectedType: AccountType
): JWTPayload {
  if (decoded.accountType && decoded.accountType !== expectedType) {
    throw new ApiError(401, "Invalid session type");
  }
  return decoded;
}

// Customer auth — food_cms_session only
export async function customerAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token =
      req.cookies["food_cms_session"] || req.cookies["food_cms.session.token"];

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = verifyTokenPayload(
      jwt.verify(token, process.env.JWT_SECRET) as JWTPayload,
      "customer"
    );

    const result = await pool.request().input("token", token).query(`
      SELECT s.*, u.email, u.email_verified,
             COALESCE(u.is_active, 1) as is_active
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = @token
      AND s.expires_at > GETDATE()
    `);

    if (result.recordset.length === 0) {
      throw new ApiError(401, "Invalid or expired session");
    }

    const session = result.recordset[0];

    if (session.is_active === false || session.is_active === 0) {
      throw new ApiError(403, "Account is disabled");
    }

    await pool.request().input("token", token).query(`
      UPDATE sessions SET last_activity = GETDATE() WHERE token = @token
    `);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: "user",
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Token expired"));
    }
    next(error);
  }
}

// Dashboard auth — dashboard_session only
export async function dashboardAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies["dashboard_session"];

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = verifyTokenPayload(
      jwt.verify(token, process.env.JWT_SECRET) as JWTPayload,
      "dashboard"
    );

    const result = await pool.request().input("token", token).query(`
      SELECT s.*, u.email, u.email_verified,
             COALESCE(u.is_active, 1) as is_active, u.role
      FROM dashboard_sessions s
      JOIN dashboard_users u ON s.dashboard_user_id = u.id
      WHERE s.token = @token
      AND s.expires_at > GETDATE()
    `);

    if (result.recordset.length === 0) {
      throw new ApiError(401, "Invalid or expired session");
    }

    const session = result.recordset[0];

    if (session.is_active === false || session.is_active === 0) {
      throw new ApiError(403, "Account is disabled");
    }

    await pool.request().input("token", token).query(`
      UPDATE dashboard_sessions SET last_activity = GETDATE() WHERE token = @token
    `);

    const adminContext = await loadDashboardContext(decoded.userId);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: session.role || decoded.role,
    };

    if (adminContext) {
      req.adminContext = adminContext;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Token expired"));
    }
    next(error);
  }
}

/** @deprecated Use customerAuthMiddleware or dashboardAuthMiddleware */
export const authMiddleware = customerAuthMiddleware;

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const context =
      req.adminContext || (await loadDashboardContext(req.user.id));

    if (!context) {
      throw new ApiError(403, "Admin access required");
    }

    req.adminContext = context;
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(...permissions: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }

      const context =
        req.adminContext || (await loadDashboardContext(req.user.id));

      if (!context) {
        throw new ApiError(403, "Admin access required");
      }

      if (!hasPermission(context, permissions)) {
        throw new ApiError(403, "Insufficient permissions");
      }

      req.adminContext = context;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireSuperAdmin() {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }

      const context =
        req.adminContext || (await loadDashboardContext(req.user.id));

      if (!context || context.role !== "super_admin") {
        throw new ApiError(403, "Super admin access required");
      }

      req.adminContext = context;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const customerToken =
      req.cookies["food_cms_session"] || req.cookies["food_cms.session.token"];

    if (customerToken) {
      const decoded = jwt.verify(
        customerToken,
        process.env.JWT_SECRET || "your-jwt-secret"
      ) as JWTPayload;

      if (!decoded.accountType || decoded.accountType === "customer") {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: "user",
        };
      }
    }

    next();
  } catch {
    next();
  }
}
