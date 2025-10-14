"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.sanitizeMiddleware = sanitizeMiddleware;
const zod_1 = require("zod");
const validation_1 = require("../utils/validation");
// Recursively sanitize nested objects
function sanitizeObject(obj) {
    if (typeof obj === "string") {
        return (0, validation_1.sanitizeInput)(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
    }
    if (typeof obj === "object" && obj !== null) {
        const sanitized = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
}
// Validate request body against Zod schema
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            // Sanitize string inputs (including nested objects)
            if (typeof req.body === "object" && req.body !== null) {
                req.body = sanitizeObject(req.body);
            }
            // Validate against schema
            const validated = await schema.parseAsync(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors,
                });
            }
            next(error);
        }
    };
}
// Validate request query params
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.query);
            req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    errors,
                });
            }
            next(error);
        }
    };
}
// Validate request params
function validateParams(schema) {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.params);
            req.params = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                return res.status(400).json({
                    success: false,
                    message: "Invalid parameters",
                    errors,
                });
            }
            next(error);
        }
    };
}
// Sanitize all request data
function sanitizeMiddleware(req, res, next) {
    try {
        // Sanitize body
        if (typeof req.body === "object" && req.body !== null) {
            for (const key in req.body) {
                if (typeof req.body[key] === "string") {
                    req.body[key] = (0, validation_1.sanitizeInput)(req.body[key]);
                }
            }
        }
        // Sanitize query
        if (typeof req.query === "object" && req.query !== null) {
            for (const key in req.query) {
                if (typeof req.query[key] === "string") {
                    req.query[key] = (0, validation_1.sanitizeInput)(req.query[key]);
                }
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=validation.middleware.js.map