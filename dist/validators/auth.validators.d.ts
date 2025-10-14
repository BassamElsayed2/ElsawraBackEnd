import { z } from "zod";
export declare const signUpSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    full_name: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
}, {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
}>;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const updateProfileSchema: z.ZodEffects<z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    full_name?: string;
    phone?: string;
}, {
    full_name?: string;
    phone?: string;
}>, {
    full_name?: string;
    phone?: string;
}, {
    full_name?: string;
    phone?: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    old_password: z.ZodString;
    new_password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    old_password?: string;
    new_password?: string;
}, {
    old_password?: string;
    new_password?: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password?: string;
    token?: string;
}, {
    password?: string;
    token?: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token?: string;
}, {
    token?: string;
}>;
//# sourceMappingURL=auth.validators.d.ts.map