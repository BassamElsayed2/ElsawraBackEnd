"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimiter = exports.passwordResetLimiter = exports.ordersLimiter = exports.otpLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General API rate limiter - 100 requests per 15 minutes
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests, please try again later.",
            retryAfter: Math.ceil(15 * 60), // seconds
        });
    },
});
// Auth routes rate limiter - 5 requests per 15 minutes
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many authentication attempts. Please try again in 15 minutes.",
            retryAfter: Math.ceil(15 * 60),
        });
    },
});
// OTP routes rate limiter - 3 requests per 15 minutes
exports.otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Too many OTP requests, please try again later.",
    keyGenerator: (req) => {
        // Rate limit by phone number if available, otherwise by IP
        return req.body.phone || req.ip || "unknown";
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many OTP requests. Please try again in 15 minutes.",
            retryAfter: Math.ceil(15 * 60),
        });
    },
});
// Orders routes rate limiter - 20 requests per 15 minutes
exports.ordersLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many order requests, please try again later.",
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many order requests. Please slow down.",
            retryAfter: Math.ceil(15 * 60),
        });
    },
});
// Password reset rate limiter - 3 requests per hour
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyGenerator: (req) => {
        // Rate limit by email if available, otherwise by IP
        return req.body.email || req.ip || "unknown";
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many password reset attempts. Please try again in 1 hour.",
            retryAfter: Math.ceil(60 * 60),
        });
    },
});
// File upload rate limiter - 10 uploads per hour
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many file uploads. Please try again later.",
            retryAfter: Math.ceil(60 * 60),
        });
    },
});
//# sourceMappingURL=rate-limit.middleware.js.map