"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.ApiError = void 0;
const logger_1 = require("../utils/logger");
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Log error
    if (statusCode >= 500) {
        logger_1.logger.error("Server Error:", {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
    }
    else {
        logger_1.logger.warn("Client Error:", {
            message: err.message,
            statusCode,
            path: req.path,
            method: req.method,
        });
    }
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === "development";
    res.status(statusCode).json({
        success: false,
        message,
        ...(isDevelopment && { stack: err.stack }),
        ...(isDevelopment && { error: err }),
    });
};
exports.errorHandler = errorHandler;
// Async handler wrapper to catch errors
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map