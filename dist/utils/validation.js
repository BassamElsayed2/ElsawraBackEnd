"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidSchema = exports.phoneSchema = exports.emailSchema = exports.passwordSchema = void 0;
exports.validatePassword = validatePassword;
exports.sanitizeInput = sanitizeInput;
exports.normalizePhone = normalizePhone;
const zod_1 = require("zod");
// Password validation schema
exports.passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
// Email validation schema
exports.emailSchema = zod_1.z.string().email("Invalid email address");
// Phone validation schema (Egyptian format)
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^(\+?20)?[0-9]{10,11}$/, "Invalid Egyptian phone number");
// UUID validation schema
exports.uuidSchema = zod_1.z.string().uuid("Invalid ID format");
// Validate password strength
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
// Sanitize input to prevent XSS
function sanitizeInput(input) {
    return input
        .replace(/[<>]/g, "") // Remove < and >
        .trim();
}
// Validate and normalize phone number
function normalizePhone(phone) {
    // Remove spaces, dashes, parentheses
    let normalized = phone.replace(/[\s\-()]/g, "");
    // Add +20 prefix if not present
    if (!normalized.startsWith("+")) {
        if (normalized.startsWith("20")) {
            normalized = "+" + normalized;
        }
        else if (normalized.startsWith("0")) {
            normalized = "+20" + normalized.slice(1);
        }
        else {
            normalized = "+20" + normalized;
        }
    }
    return normalized;
}
//# sourceMappingURL=validation.js.map