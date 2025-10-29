import { z } from "zod";
export declare const createOrderSchema: z.ZodObject<{
    address_id: z.ZodOptional<z.ZodString>;
    delivery_type: z.ZodEnum<["delivery", "pickup"]>;
    branch_id: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        product_id: z.ZodOptional<z.ZodString>;
        offer_id: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["product", "offer"]>;
        title_ar: z.ZodString;
        title_en: z.ZodString;
        quantity: z.ZodNumber;
        price_per_unit: z.ZodNumber;
        total_price: z.ZodNumber;
        size: z.ZodOptional<z.ZodString>;
        size_data: z.ZodOptional<z.ZodAny>;
        variants: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: "product" | "offer";
        title_ar?: string;
        title_en?: string;
        product_id?: string;
        notes?: string;
        offer_id?: string;
        quantity?: number;
        price_per_unit?: number;
        total_price?: number;
        size?: string;
        size_data?: any;
        variants?: string[];
    }, {
        type?: "product" | "offer";
        title_ar?: string;
        title_en?: string;
        product_id?: string;
        notes?: string;
        offer_id?: string;
        quantity?: number;
        price_per_unit?: number;
        total_price?: number;
        size?: string;
        size_data?: any;
        variants?: string[];
    }>, "many">;
    subtotal: z.ZodNumber;
    delivery_fee: z.ZodNumber;
    total: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    payment_method: z.ZodOptional<z.ZodEnum<["cash", "card", "wallet", "easykash"]>>;
}, "strip", z.ZodTypeAny, {
    branch_id?: string;
    items?: {
        type?: "product" | "offer";
        title_ar?: string;
        title_en?: string;
        product_id?: string;
        notes?: string;
        offer_id?: string;
        quantity?: number;
        price_per_unit?: number;
        total_price?: number;
        size?: string;
        size_data?: any;
        variants?: string[];
    }[];
    address_id?: string;
    delivery_type?: "delivery" | "pickup";
    subtotal?: number;
    delivery_fee?: number;
    total?: number;
    notes?: string;
    payment_method?: "cash" | "card" | "wallet" | "easykash";
}, {
    branch_id?: string;
    items?: {
        type?: "product" | "offer";
        title_ar?: string;
        title_en?: string;
        product_id?: string;
        notes?: string;
        offer_id?: string;
        quantity?: number;
        price_per_unit?: number;
        total_price?: number;
        size?: string;
        size_data?: any;
        variants?: string[];
    }[];
    address_id?: string;
    delivery_type?: "delivery" | "pickup";
    subtotal?: number;
    delivery_fee?: number;
    total?: number;
    notes?: string;
    payment_method?: "cash" | "card" | "wallet" | "easykash";
}>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "pending_payment", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "pending_payment" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
}, {
    status?: "pending" | "pending_payment" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
}>;
export declare const getOrdersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "pending_payment", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"]>>;
    order_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    status?: "pending" | "pending_payment" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
    page?: number;
    order_id?: string;
}, {
    limit?: string;
    status?: "pending" | "pending_payment" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
    page?: string;
    order_id?: string;
}>;
export declare const getOrderStatsQuerySchema: z.ZodOptional<z.ZodObject<{
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    branch_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
}, {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
}>>;
//# sourceMappingURL=orders.validators.d.ts.map