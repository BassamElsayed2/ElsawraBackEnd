export interface CreateOrderData {
    address_id?: string;
    delivery_type: "delivery" | "pickup";
    branch_id?: string;
    items: any[];
    subtotal: number;
    delivery_fee: number;
    total: number;
    notes?: string;
    payment_method?: string;
}
export declare class OrdersService {
    static getUserOrders(userId: string, page?: number, limit?: number): Promise<{
        orders: any[];
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getOrderById(orderId: string, userId?: string): Promise<any>;
    static createOrder(userId: string, data: CreateOrderData): Promise<any>;
    static updateOrderStatus(orderId: string, status: string): Promise<any>;
    static cancelOrder(orderId: string, userId: string): Promise<any>;
    static getAllOrders(page?: number, limit?: number, status?: string): Promise<{
        orders: any[];
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getOrderStats(filters?: {
        start_date?: string;
        end_date?: string;
        branch_id?: string;
    }): Promise<any>;
}
//# sourceMappingURL=orders.service.d.ts.map