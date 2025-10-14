"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoriesQuerySchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(1, "Arabic name is required"),
    name_en: zod_1.z.string().min(1, "English name is required"),
    description_ar: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    display_order: zod_1.z.number().int().min(0).optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.updateCategorySchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(1).optional(),
    name_en: zod_1.z.string().min(1).optional(),
    description_ar: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    display_order: zod_1.z.number().int().min(0).optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.getCategoriesQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    is_active: zod_1.z.enum(["true", "false"]).optional(),
});
//# sourceMappingURL=categories.validators.js.map