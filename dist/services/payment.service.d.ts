import sql from "mssql";
export interface InitiatePaymentData {
    order_id: string;
    amount: number;
    currency?: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
}
export interface PaymentCallbackData {
    ProductCode?: string;
    PaymentMethod?: string;
    ProductType?: string;
    Amount: string;
    BuyerEmail?: string;
    BuyerMobile?: string;
    BuyerName?: string;
    Timestamp?: string;
    status: string;
    voucher?: string;
    easykashRef: string;
    VoucherData?: string;
    customerReference?: string;
    signatureHash?: string;
}
export declare class PaymentService {
    private static readonly EASYKASH_API_URL;
    private static readonly EASYKASH_API_KEY;
    private static readonly EASYKASH_HMAC_SECRET;
    private static readonly FRONTEND_URL;
    private static readonly BACKEND_URL;
    /**
     * Initiate payment with EasyKash
     */
    static initiatePayment(userId: string, data: InitiatePaymentData): Promise<{
        paymentId: `${string}-${string}-${string}-${string}-${string}`;
        transactionId: any;
        paymentUrl: any;
        expiresAt: any;
    }>;
    /**
     * Verify HMAC signature from EasyKash callback
     * According to EasyKash documentation, signature is calculated from specific fields
     */
    static verifyHmacSignature(data: PaymentCallbackData): boolean;
    /**
     * Test function to verify EasyKash signature with example data
     * This matches the example provided in EasyKash documentation
     */
    static testEasyKashSignature(): boolean;
    /**
     * Test function for the new EasyKash callback format
     * Based on the response example provided
     */
    static testNewEasyKashFormat(): boolean;
    /**
     * Handle payment callback from EasyKash
     */
    static handleCallback(data: PaymentCallbackData): Promise<{
        success: boolean;
        paymentId: any;
        orderId: any;
        status: string;
    }>;
    /**
     * Get payment status by payment ID
     * Auto-expires pending payments after 30 minutes
     */
    static getPaymentStatus(paymentId: string, userId?: string): Promise<{
        id: any;
        orderId: any;
        amount: any;
        currency: any;
        status: any;
        provider: any;
        transactionId: any;
        referenceNumber: any;
        createdAt: any;
        updatedAt: any;
        orderStatus: any;
        orderPaymentStatus: any;
    }>;
    /**
     * Get payment by order ID
     */
    static getPaymentByOrderId(orderId: string, userId?: string): Promise<any>;
    /**
     * Cancel payment manually (when user returns without completing payment)
     */
    static cancelPayment(paymentId: string, userId?: string): Promise<{
        success: boolean;
        paymentId: string;
        status: string;
    }>;
    /**
     * Get all payments (admin)
     */
    static getAllPayments(page?: number, limit?: number, status?: string, orderId?: string): Promise<{
        payments: sql.IRecordSet<any>;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=payment.service.d.ts.map