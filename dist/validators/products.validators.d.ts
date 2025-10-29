import { z } from "zod";
export declare const createProductSchema: z.ZodObject<{
    title_ar: z.ZodString;
    title_en: z.ZodString;
    description_ar: z.ZodOptional<z.ZodString>;
    description_en: z.ZodOptional<z.ZodString>;
    category_id: z.ZodString;
    user_id: z.ZodOptional<z.ZodString>;
    image_url: z.ZodOptional<z.ZodString>;
    types: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        product_id: z.ZodOptional<z.ZodString>;
        name_ar: z.ZodString;
        name_en: z.ZodString;
        sizes: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            type_id: z.ZodOptional<z.ZodString>;
            size_ar: z.ZodString;
            size_en: z.ZodString;
            price: z.ZodNumber;
            offer_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            created_at: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }, {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }>, "many">;
        created_at: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }, {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    category_id?: string;
    image_url?: string;
    types?: {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }[];
    user_id?: string;
}, {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    category_id?: string;
    image_url?: string;
    types?: {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }[];
    user_id?: string;
}>;
export declare const updateProductSchema: z.ZodObject<{
    title_ar: z.ZodOptional<z.ZodString>;
    title_en: z.ZodOptional<z.ZodString>;
    description_ar: z.ZodOptional<z.ZodString>;
    description_en: z.ZodOptional<z.ZodString>;
    category_id: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodString>;
    image_url: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    types: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        product_id: z.ZodOptional<z.ZodString>;
        name_ar: z.ZodString;
        name_en: z.ZodString;
        sizes: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            type_id: z.ZodOptional<z.ZodString>;
            size_ar: z.ZodString;
            size_en: z.ZodString;
            price: z.ZodNumber;
            offer_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            created_at: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }, {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }>, "many">;
        created_at: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }, {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    category_id?: string;
    image_url?: string;
    types?: {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }[];
    is_active?: boolean;
    user_id?: string;
}, {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    category_id?: string;
    image_url?: string;
    types?: {
        id?: string;
        product_id?: string;
        created_at?: string;
        name_ar?: string;
        name_en?: string;
        sizes?: {
            id?: string;
            price?: number;
            type_id?: string;
            size_ar?: string;
            size_en?: string;
            offer_price?: number;
            created_at?: string;
        }[];
    }[];
    is_active?: boolean;
    user_id?: string;
}>;
export declare const getProductsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    category_id: z.ZodOptional<z.ZodString>;
    branch_id: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    search?: string;
    category_id?: string;
    is_active?: boolean;
    page?: number;
    branch_id?: string;
}, {
    limit?: string;
    search?: string;
    category_id?: string;
    is_active?: "true" | "false";
    page?: string;
    branch_id?: string;
}>;
//# sourceMappingURL=products.validators.d.ts.map