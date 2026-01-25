import { z } from "zod";
import { uuidSchema } from "../utils/validation";

const productSizeSchema = z.object({
  id: uuidSchema.optional(),
  type_id: uuidSchema.optional(),
  size_ar: z.string().min(1, "اسم الحجم بالعربية مطلوب"),
  size_en: z.string().min(1, "اسم الحجم بالإنجليزية مطلوب"),
  price: z.number().positive("السعر مطلوب"),
  offer_price: z
    .number()
    .positive("سعر العرض يجب أن يكون رقم موجب")
    .nullable()
    .optional(),
  created_at: z.string().optional(),
});

const productTypeSchema = z.object({
  id: uuidSchema.optional(),
  product_id: uuidSchema.optional(),
  name_ar: z.string().min(1, "اسم النوع بالعربية مطلوب"),
  name_en: z.string().min(1, "اسم النوع بالإنجليزية مطلوب"),
  sizes: z
    .array(productSizeSchema)
    .min(1, "يجب إضافة حجم واحد على الأقل لكل نوع"),
  created_at: z.string().optional(),
});

export const createProductSchema = z.object({
  title_ar: z
    .string()
    .min(2, "العنوان بالعربية يجب أن يكون على الأقل حرفين")
    .max(255, "العنوان بالعربية يجب أن لا يتجاوز 255 حرف"),
  title_en: z
    .string()
    .min(2, "العنوان بالإنجليزية يجب أن يكون على الأقل حرفين")
    .max(255, "العنوان بالإنجليزية يجب أن لا يتجاوز 255 حرف"),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id: uuidSchema,
  user_id: uuidSchema.optional(),
  image_url: z
    .string()
    .url("رابط الصورة غير صحيح")
    .optional()
    .or(z.literal("")),
  types: z
    .array(productTypeSchema)
    .min(1, "يجب إضافة نوع واحد على الأقل للمنتج"),
});

export const updateProductSchema = z.object({
  title_ar: z
    .string()
    .min(2, "العنوان بالعربية يجب أن يكون على الأقل حرفين")
    .max(255, "العنوان بالعربية يجب أن لا يتجاوز 255 حرف")
    .optional(),
  title_en: z
    .string()
    .min(2, "العنوان بالإنجليزية يجب أن يكون على الأقل حرفين")
    .max(255, "العنوان بالإنجليزية يجب أن لا يتجاوز 255 حرف")
    .optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id: uuidSchema.optional(),
  user_id: uuidSchema.optional(),
  image_url: z
    .string()
    .url("رابط الصورة غير صحيح")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional(),
  types: z.array(productTypeSchema).optional(),
});

export const getProductsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("10"),
  category_id: uuidSchema.optional(),
  branch_id: uuidSchema.optional(),
  search: z.string().max(255).optional(),
  is_active: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});
