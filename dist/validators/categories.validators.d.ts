import { z } from "zod";
export declare const createCategorySchema: z.ZodObject<{
    name_ar: z.ZodString;
    name_en: z.ZodString;
    description_ar: z.ZodOptional<z.ZodString>;
    description_en: z.ZodOptional<z.ZodString>;
    image_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    display_order: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description_ar?: string;
    description_en?: string;
    image_url?: string;
    is_active?: boolean;
    name_ar?: string;
    name_en?: string;
    display_order?: number;
}, {
    description_ar?: string;
    description_en?: string;
    image_url?: string;
    is_active?: boolean;
    name_ar?: string;
    name_en?: string;
    display_order?: number;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name_ar: z.ZodOptional<z.ZodString>;
    name_en: z.ZodOptional<z.ZodString>;
    description_ar: z.ZodOptional<z.ZodString>;
    description_en: z.ZodOptional<z.ZodString>;
    image_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    display_order: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description_ar?: string;
    description_en?: string;
    image_url?: string;
    is_active?: boolean;
    name_ar?: string;
    name_en?: string;
    display_order?: number;
}, {
    description_ar?: string;
    description_en?: string;
    image_url?: string;
    is_active?: boolean;
    name_ar?: string;
    name_en?: string;
    display_order?: number;
}>;
export declare const getCategoriesQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
}, "strip", z.ZodTypeAny, {
    search?: string;
    is_active?: "true" | "false";
}, {
    search?: string;
    is_active?: "true" | "false";
}>;
//# sourceMappingURL=categories.validators.d.ts.map