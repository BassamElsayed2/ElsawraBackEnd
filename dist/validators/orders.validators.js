"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStatsQuerySchema = exports.getOrdersQuerySchema = exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../utils/validation");
const orderItemSchema = zod_1.z.object({
    product_id: zod_1.z.string().uuid().optional(),
    offer_id: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(["product", "offer"]),
    title_ar: zod_1.z.string(),
    title_en: zod_1.z.string(),
    quantity: zod_1.z.number().int().positive(),
    price_per_unit: zod_1.z.number().positive(),
    total_price: zod_1.z.number().positive(),
    size: zod_1.z.string().optional(),
    size_data: zod_1.z.any().optional(),
    variants: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional(),
});
exports.createOrderSchema = zod_1.z.object({
    address_id: validation_1.uuidSchema.optional(),
    delivery_type: zod_1.z.enum(["delivery", "pickup"]),
    branch_id: validation_1.uuidSchema.optional(),
    items: zod_1.z.array(orderItemSchema).min(1, "Order must have at least one item"),
    subtotal: zod_1.z.number().positive(),
    delivery_fee: zod_1.z.number().min(0),
    total: zod_1.z.number().positive(),
    notes: zod_1.z.string().max(500).optional(),
    payment_method: zod_1.z.enum(["cash", "card", "wallet"]).optional(),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivering",
        "delivered",
        "cancelled",
    ]),
});
exports.getOrdersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("10"),
    status: zod_1.z
        .enum([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivering",
        "delivered",
        "cancelled",
    ])
        .optional(),
    order_id: zod_1.z.string().optional(),
});
exports.getOrderStatsQuerySchema = zod_1.z
    .object({
    start_date: zod_1.z.string().optional(),
    end_date: zod_1.z.string().optional(),
    branch_id: zod_1.z.string().uuid().optional(),
})
    .optional();
//# sourceMappingURL=orders.validators.js.map