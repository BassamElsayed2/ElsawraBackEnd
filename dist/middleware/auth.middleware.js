"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
exports.hasPermission = hasPermission;
exports.customerAuthMiddleware = customerAuthMiddleware;
exports.dashboardAuthMiddleware = dashboardAuthMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.requirePermission = requirePermission;
exports.requireSuperAdmin = requireSuperAdmin;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const error_middleware_1 = require("./error.middleware");
const roles_service_1 = require("../services/roles.service");
async function loadDashboardContext(userId) {
    const result = await database_1.pool.request().input("userId", userId).query(`
    SELECT role FROM dashboard_users WHERE id = @userId
  `);
    if (result.recordset.length === 0)
        return null;
    const role = result.recordset[0].role;
    const permissions = await roles_service_1.RolesService.getPermissionsForAdminRole(role);
    return { role, permissions };
}
function hasPermission(context, required) {
    if (context.role === "super_admin")
        return true;
    const requiredList = Array.isArray(required) ? required : [required];
    return requiredList.some((p) => context.permissions.includes(p));
}
function verifyTokenPayload(decoded, expectedType) {
    if (decoded.accountType && decoded.accountType !== expectedType) {
        throw new error_middleware_1.ApiError(401, "Invalid session type");
    }
    return decoded;
}
// Customer auth — food_cms_session only
async function customerAuthMiddleware(req, res, next) {
    try {
        const token = req.cookies["food_cms_session"] || req.cookies["food_cms.session.token"];
        if (!token) {
            throw new error_middleware_1.ApiError(401, "Authentication required");
        }
        const decoded = verifyTokenPayload(jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET), "customer");
        const result = await database_1.pool.request().input("token", token).query(`
      SELECT s.*, u.email, u.email_verified,
             COALESCE(u.is_active, 1) as is_active
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = @token
      AND s.expires_at > GETDATE()
    `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(401, "Invalid or expired session");
        }
        const session = result.recordset[0];
        if (session.is_active === false || session.is_active === 0) {
            throw new error_middleware_1.ApiError(403, "Account is disabled");
        }
        await database_1.pool.request().input("token", token).query(`
      UPDATE sessions SET last_activity = GETDATE() WHERE token = @token
    `);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: "user",
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new error_middleware_1.ApiError(401, "Invalid token"));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new error_middleware_1.ApiError(401, "Token expired"));
        }
        next(error);
    }
}
// Dashboard auth — dashboard_session only
async function dashboardAuthMiddleware(req, res, next) {
    try {
        const token = req.cookies["dashboard_session"];
        if (!token) {
            throw new error_middleware_1.ApiError(401, "Authentication required");
        }
        const decoded = verifyTokenPayload(jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET), "dashboard");
        const result = await database_1.pool.request().input("token", token).query(`
      SELECT s.*, u.email, u.email_verified,
             COALESCE(u.is_active, 1) as is_active, u.role
      FROM dashboard_sessions s
      JOIN dashboard_users u ON s.dashboard_user_id = u.id
      WHERE s.token = @token
      AND s.expires_at > GETDATE()
    `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(401, "Invalid or expired session");
        }
        const session = result.recordset[0];
        if (session.is_active === false || session.is_active === 0) {
            throw new error_middleware_1.ApiError(403, "Account is disabled");
        }
        await database_1.pool.request().input("token", token).query(`
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new error_middleware_1.ApiError(401, "Invalid token"));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new error_middleware_1.ApiError(401, "Token expired"));
        }
        next(error);
    }
}
/** @deprecated Use customerAuthMiddleware or dashboardAuthMiddleware */
exports.authMiddleware = customerAuthMiddleware;
async function adminMiddleware(req, res, next) {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError(401, "Authentication required");
        }
        const context = req.adminContext || (await loadDashboardContext(req.user.id));
        if (!context) {
            throw new error_middleware_1.ApiError(403, "Admin access required");
        }
        req.adminContext = context;
        next();
    }
    catch (error) {
        next(error);
    }
}
function requirePermission(...permissions) {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                throw new error_middleware_1.ApiError(401, "Authentication required");
            }
            const context = req.adminContext || (await loadDashboardContext(req.user.id));
            if (!context) {
                throw new error_middleware_1.ApiError(403, "Admin access required");
            }
            if (!hasPermission(context, permissions)) {
                throw new error_middleware_1.ApiError(403, "Insufficient permissions");
            }
            req.adminContext = context;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
function requireSuperAdmin() {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                throw new error_middleware_1.ApiError(401, "Authentication required");
            }
            const context = req.adminContext || (await loadDashboardContext(req.user.id));
            if (!context || context.role !== "super_admin") {
                throw new error_middleware_1.ApiError(403, "Super admin access required");
            }
            req.adminContext = context;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
async function optionalAuthMiddleware(req, res, next) {
    try {
        const customerToken = req.cookies["food_cms_session"] || req.cookies["food_cms.session.token"];
        if (customerToken) {
            const decoded = jsonwebtoken_1.default.verify(customerToken, process.env.JWT_SECRET || "your-jwt-secret");
            if (!decoded.accountType || decoded.accountType === "customer") {
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: "user",
                };
            }
        }
        next();
    }
    catch {
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map