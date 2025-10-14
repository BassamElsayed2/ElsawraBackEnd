"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = logSecurityEvent;
exports.suspiciousActivityDetector = suspiciousActivityDetector;
exports.csrfProtection = csrfProtection;
exports.securityHeaders = securityHeaders;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
// Log security event to database
async function logSecurityEvent(eventType, req, userId, email, details) {
    try {
        await database_1.pool
            .request()
            .input("eventType", eventType)
            .input("userId", userId || null)
            .input("email", email || null)
            .input("ipAddress", req.ip || null)
            .input("userAgent", req.get("user-agent") || null)
            .input("location", null) // Can be populated with IP geolocation
            .input("details", details ? JSON.stringify(details) : null)
            .execute("sp_RecordSecurityEvent");
    }
    catch (error) {
        logger_1.logger.error("Failed to log security event:", error);
    }
}
// Middleware to detect suspicious activity
async function suspiciousActivityDetector(req, res, next) {
    try {
        const ip = req.ip;
        const path = req.path;
        // Check for SQL injection patterns
        const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b|--|\/\*|\*\/|;|'|"|\bOR\b|\bAND\b)/gi;
        const bodyStr = JSON.stringify(req.body);
        const queryStr = JSON.stringify(req.query);
        if (sqlInjectionPattern.test(bodyStr) ||
            sqlInjectionPattern.test(queryStr)) {
            logger_1.logger.warn("Potential SQL injection detected", {
                ip,
                path,
                body: req.body,
                query: req.query,
            });
            await logSecurityEvent("SUSPICIOUS_ACTIVITY", req, undefined, undefined, {
                reason: "SQL injection attempt",
                path,
            });
            return res.status(400).json({
                success: false,
                message: "Invalid request",
            });
        }
        // Check for XSS patterns
        const xssPattern = /<script|javascript:|onerror=|onload=/gi;
        if (xssPattern.test(bodyStr) || xssPattern.test(queryStr)) {
            logger_1.logger.warn("Potential XSS detected", {
                ip,
                path,
            });
            await logSecurityEvent("SUSPICIOUS_ACTIVITY", req, undefined, undefined, {
                reason: "XSS attempt",
                path,
            });
            return res.status(400).json({
                success: false,
                message: "Invalid request",
            });
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
// CSRF protection for state-changing operations
function csrfProtection(req, res, next) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }
    // Check origin header
    const origin = req.get("origin");
    const referer = req.get("referer");
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.DASHBOARD_URL,
        process.env.API_URL,
    ].filter(Boolean);
    if (origin &&
        !allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        logger_1.logger.warn("CSRF: Invalid origin", { origin, path: req.path });
        return res.status(403).json({
            success: false,
            message: "Forbidden",
        });
    }
    next();
}
// Security headers middleware (complementing Helmet)
function securityHeaders(req, res, next) {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Enable XSS filter
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Remove X-Powered-By
    res.removeHeader("X-Powered-By");
    next();
}
//# sourceMappingURL=security.middleware.js.map