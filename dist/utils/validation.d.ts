import { z } from "zod";
export declare const passwordSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
};
export declare function sanitizeInput(input: string): string;
export declare function normalizePhone(phone: string): string;
//# sourceMappingURL=validation.d.ts.map