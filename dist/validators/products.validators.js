"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsQuerySchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../utils/validation");
const productSizeSchema = zod_1.z.object({
    id: validation_1.uuidSchema.optional(),
    type_id: validation_1.uuidSchema.optional(),
    size_ar: zod_1.z.string().min(1),
    size_en: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    offer_price: zod_1.z.number().positive().nullable().optional(),
    created_at: zod_1.z.string().optional(),
});
const productTypeSchema = zod_1.z.object({
    id: validation_1.uuidSchema.optional(),
    product_id: validation_1.uuidSchema.optional(),
    name_ar: zod_1.z.string().min(1),
    name_en: zod_1.z.string().min(1),
    sizes: zod_1.z.array(productSizeSchema).min(1),
    created_at: zod_1.z.string().optional(),
});
exports.createProductSchema = zod_1.z.object({
    title_ar: zod_1.z.string().min(2).max(255),
    title_en: zod_1.z.string().min(2).max(255),
    description_ar: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    category_id: validation_1.uuidSchema,
    user_id: validation_1.uuidSchema.optional(),
    image_url: zod_1.z.string().url().optional(),
    types: zod_1.z.array(productTypeSchema).min(1),
});
exports.updateProductSchema = zod_1.z.object({
    title_ar: zod_1.z.string().min(2).max(255).optional(),
    title_en: zod_1.z.string().min(2).max(255).optional(),
    description_ar: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    category_id: validation_1.uuidSchema.optional(),
    user_id: validation_1.uuidSchema.optional(),
    image_url: zod_1.z.string().url().optional(),
    is_active: zod_1.z.boolean().optional(),
    types: zod_1.z.array(productTypeSchema).optional(),
});
exports.getProductsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("10"),
    category_id: validation_1.uuidSchema.optional(),
    branch_id: validation_1.uuidSchema.optional(),
    search: zod_1.z.string().max(255).optional(),
    is_active: zod_1.z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
});
//# sourceMappingURL=products.validators.js.map