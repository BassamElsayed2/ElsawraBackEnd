"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.signInSchema = exports.signUpSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../utils/validation");
exports.signUpSchema = zod_1.z.object({
    email: validation_1.emailSchema,
    password: validation_1.passwordSchema,
    full_name: zod_1.z
        .string()
        .min(2, "Full name must be at least 2 characters")
        .max(100),
    phone: validation_1.phoneSchema,
});
exports.signInSchema = zod_1.z.object({
    email: validation_1.emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.updateProfileSchema = zod_1.z
    .object({
    full_name: zod_1.z.string().min(2).max(100).optional(),
    phone: validation_1.phoneSchema.optional(),
})
    .refine((data) => data.full_name || data.phone, {
    message: "At least one field must be provided",
});
exports.changePasswordSchema = zod_1.z.object({
    old_password: zod_1.z.string().min(1, "Current password is required"),
    new_password: validation_1.passwordSchema,
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: validation_1.emailSchema,
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    password: validation_1.passwordSchema,
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Verification token is required"),
});
//# sourceMappingURL=auth.validators.js.map