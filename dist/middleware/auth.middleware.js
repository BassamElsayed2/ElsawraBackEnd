"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const error_middleware_1 = require("./error.middleware");
// Verify JWT token from cookie
async function authMiddleware(req, res, next) {
    try {
        // Get token from cookies
        const token = req.cookies["food_cms_session"] || req.cookies["food_cms.session.token"];
        if (!token) {
            throw new error_middleware_1.ApiError(401, "Authentication required");
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if session exists and is valid
        const result = await database_1.pool.request().input("token", token).query(`
        SELECT s.*, u.email, u.email_verified
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = @token
        AND s.expires_at > GETDATE()
      `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(401, "Invalid or expired session");
        }
        const session = result.recordset[0];
        // Update last activity
        await database_1.pool.request().input("token", token).query(`
        UPDATE sessions
        SET last_activity = GETDATE()
        WHERE token = @token
      `);
        // Attach user to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
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
// Check if user is admin
async function adminMiddleware(req, res, next) {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError(401, "Authentication required");
        }
        // Check if user is admin
        const result = await database_1.pool.request().input("userId", req.user.id).query(`
        SELECT id, role
        FROM admin_profiles
        WHERE user_id = @userId
      `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(403, "Admin access required");
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
// Optional auth - doesn't throw error if no token
async function optionalAuthMiddleware(req, res, next) {
    try {
        const token = req.cookies["food_cms_session"] || req.cookies["food_cms.session.token"];
        if (!token) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-jwt-secret");
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        // Ignore errors in optional auth
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map