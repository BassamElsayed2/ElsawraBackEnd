"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsQuerySchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../utils/validation");
const productSizeSchema = zod_1.z.object({
    id: validation_1.uuidSchema.optional(),
    type_id: validation_1.uuidSchema.optional(),
    size_ar: zod_1.z.string().min(1, "اسم الحجم بالعربية مطلوب"),
    size_en: zod_1.z.string().min(1, "اسم الحجم بالإنجليزية مطلوب"),
    price: zod_1.z.number().positive("السعر مطلوب"),
    offer_price: zod_1.z
        .number()
        .positive("سعر العرض يجب أن يكون رقم موجب")
        .nullable()
        .optional(),
    created_at: zod_1.z.string().optional(),
});
const productTypeSchema = zod_1.z.object({
    id: validation_1.uuidSchema.optional(),
    product_id: validation_1.uuidSchema.optional(),
    name_ar: zod_1.z.string().min(1, "اسم النوع بالعربية مطلوب"),
    name_en: zod_1.z.string().min(1, "اسم النوع بالإنجليزية مطلوب"),
    sizes: zod_1.z
        .array(productSizeSchema)
        .min(1, "يجب إضافة حجم واحد على الأقل لكل نوع"),
    created_at: zod_1.z.string().optional(),
});
exports.createProductSchema = zod_1.z.object({
    title_ar: zod_1.z
        .string()
        .min(2, "العنوان بالعربية يجب أن يكون على الأقل حرفين")
        .max(255, "العنوان بالعربية يجب أن لا يتجاوز 255 حرف"),
    title_en: zod_1.z
        .string()
        .min(2, "العنوان بالإنجليزية يجب أن يكون على الأقل حرفين")
        .max(255, "العنوان بالإنجليزية يجب أن لا يتجاوز 255 حرف"),
    description_ar: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    category_id: validation_1.uuidSchema,
    user_id: validation_1.uuidSchema.optional(),
    image_url: zod_1.z
        .string()
        .url("رابط الصورة غير صحيح")
        .optional()
        .or(zod_1.z.literal("")),
    types: zod_1.z
        .array(productTypeSchema)
        .min(1, "يجب إضافة نوع واحد على الأقل للمنتج"),
});
exports.updateProductSchema = zod_1.z.object({
    title_ar: zod_1.z
        .string()
        .min(2, "العنوان بالعربية يجب أن يكون على الأقل حرفين")
        .max(255, "العنوان بالعربية يجب أن لا يتجاوز 255 حرف")
        .optional(),
    title_en: zod_1.z
        .string()
        .min(2, "العنوان بالإنجليزية يجب أن يكون على الأقل حرفين")
        .max(255, "العنوان بالإنجليزية يجب أن لا يتجاوز 255 حرف")
        .optional(),
    description_ar: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    category_id: validation_1.uuidSchema.optional(),
    user_id: validation_1.uuidSchema.optional(),
    image_url: zod_1.z
        .string()
        .url("رابط الصورة غير صحيح")
        .optional()
        .or(zod_1.z.literal("")),
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