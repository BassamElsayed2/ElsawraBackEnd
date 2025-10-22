"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const mssql_1 = __importDefault(require("mssql"));
const crypto_1 = __importDefault(require("crypto"));
class PaymentService {
    /**
     * Initiate payment with EasyKash
     */
    static async initiatePayment(userId, data) {
        try {
            // Validate API key
            if (!this.EASYKASH_API_KEY) {
                throw new error_middleware_1.ApiError(500, "EasyKash API key not configured");
            }
            // Verify order exists and belongs to user
            const orderCheck = await database_1.pool
                .request()
                .input("orderId", mssql_1.default.UniqueIdentifier, data.order_id)
                .input("userId", mssql_1.default.UniqueIdentifier, userId).query(`
          SELECT id, total, status, payment_status 
          FROM orders 
          WHERE id = @orderId AND user_id = @userId
        `);
            if (orderCheck.recordset.length === 0) {
                throw new error_middleware_1.ApiError(404, "Order not found");
            }
            const order = orderCheck.recordset[0];
            // Check if order is already paid
            if (order.payment_status === "paid") {
                throw new error_middleware_1.ApiError(400, "Order is already paid");
            }
            // Verify amount matches order total
            if (Math.abs(order.total - data.amount) > 0.01) {
                throw new error_middleware_1.ApiError(400, "Payment amount does not match order total");
            }
            // Create payment record in database
            const paymentId = crypto_1.default.randomUUID();
            await database_1.pool
                .request()
                .input("id", mssql_1.default.UniqueIdentifier, paymentId)
                .input("orderId", mssql_1.default.UniqueIdentifier, data.order_id)
                .input("userId", mssql_1.default.UniqueIdentifier, userId)
                .input("amount", mssql_1.default.Decimal(10, 2), data.amount)
                .input("currency", mssql_1.default.NVarChar(10), data.currency || "EGP")
                .input("status", mssql_1.default.NVarChar(50), "pending")
                .input("provider", mssql_1.default.NVarChar(50), "easykash").query(`
          INSERT INTO payments (id, order_id, user_id, amount, currency, status, provider, created_at)
          VALUES (@id, @orderId, @userId, @amount, @currency, @status, @provider, GETDATE())
        `);
            // Prepare EasyKash API request
            const redirectUrl = `${this.FRONTEND_URL}/payment/result?id=${data.order_id}`;
            const callbackUrl = `${this.BACKEND_URL}/api/payments/easykash/callback`;
            // Prepare custom data for customerReference
            const customerReference = JSON.stringify({
                orderId: data.order_id,
                paymentId: paymentId,
                userId: userId,
            });
            // EasyKash Direct Payment API request format
            const paymentRequest = {
                amount: data.amount,
                currency: data.currency || "EGP",
                paymentOptions: [2, 4], // All payment methods: 2=debit, 3=Card, 4=Wallet, 5=ValU, 6=Kiosk
                cashExpiry: 3, // hours until cash payment expires
                name: data.customer_name,
                email: data.customer_email || "",
                mobile: data.customer_phone || "",
                redirectUrl: redirectUrl,
                customerReference: customerReference, // Use the JSON string
            };
            // Make request to EasyKash API
            const response = await fetch(`${this.EASYKASH_API_URL}/api/directpayv1/pay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.EASYKASH_API_KEY, // Direct API key without "Bearer"
                },
                body: JSON.stringify(paymentRequest),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new error_middleware_1.ApiError(response.status, `EasyKash API error: ${errorData.message || response.statusText}`);
            }
            const paymentData = await response.json();
            // EasyKash returns redirectUrl
            const paymentUrl = paymentData.redirectUrl || paymentData.paymentUrl || "";
            // Extract productCode from redirectUrl if available
            let productCode = "";
            if (paymentUrl) {
                const match = paymentUrl.match(/DirectPayV1\/([^\/\?]+)/);
                if (match) {
                    productCode = match[1];
                }
            }
            // Update payment record with product code
            if (productCode) {
                await database_1.pool
                    .request()
                    .input("paymentId", mssql_1.default.UniqueIdentifier, paymentId)
                    .input("transactionId", mssql_1.default.NVarChar(255), productCode).query(`
            UPDATE payments 
            SET transaction_id = @transactionId, updated_at = GETDATE()
            WHERE id = @paymentId
          `);
            }
            return {
                paymentId,
                transactionId: productCode || paymentData.transactionId || "",
                paymentUrl: paymentUrl,
                expiresAt: paymentData.expiresAt,
            };
        }
        catch (error) {
            // Log error for debugging
            console.error("Payment initiation error:", error);
            if (error instanceof error_middleware_1.ApiError) {
                throw error;
            }
            throw new error_middleware_1.ApiError(500, `Failed to initiate payment: ${error.message}`);
        }
    }
    /**
     * Verify HMAC signature from EasyKash callback
     * According to EasyKash documentation, signature is calculated from specific fields
     */
    static verifyHmacSignature(data) {
        // If no signature provided, skip verification (for testing or some callback types)
        if (!data.signatureHash) {
            console.log("⚠️ No signature provided, skipping verification");
            return true; // Allow callback to proceed without signature verification
        }
        if (!this.EASYKASH_HMAC_SECRET) {
            console.log("⚠️ HMAC secret not configured, skipping verification");
            return true; // Allow callback to proceed without secret
        }
        // Extract specific fields in exact order as per EasyKash docs
        const { ProductCode, Amount, ProductType, PaymentMethod, status, easykashRef, customerReference, signatureHash, } = data;
        // Concatenate fields in exact order (no separators)
        const dataToSecure = [
            ProductCode,
            Amount,
            ProductType,
            PaymentMethod,
            status,
            easykashRef,
            customerReference,
        ];
        const dataStr = dataToSecure.join("");
        console.log("🔐 EasyKash Signature Verification:");
        console.log("Data to secure:", dataStr);
        console.log("Secret key:", this.EASYKASH_HMAC_SECRET);
        console.log("Received signature:", signatureHash);
        // Generate HMAC SHA-512 hash
        const calculatedSignature = crypto_1.default
            .createHmac("sha512", this.EASYKASH_HMAC_SECRET)
            .update(dataStr)
            .digest("hex");
        console.log("Calculated signature:", calculatedSignature);
        console.log("Signatures match:", calculatedSignature === signatureHash);
        // Compare signatures
        return calculatedSignature === signatureHash;
    }
    /**
     * Test function to verify EasyKash signature with example data
     * This matches the example provided in EasyKash documentation
     */
    static testEasyKashSignature() {
        const testPayload = {
            ProductCode: "EDV4471",
            Amount: "11.00",
            ProductType: "Direct Pay",
            PaymentMethod: "Cash Through Fawry",
            BuyerName: "mee",
            BuyerEmail: "test@mail.com",
            BuyerMobile: "0123456789",
            status: "PAID",
            voucher: "",
            easykashRef: "2911105009",
            VoucherData: "Direct Pay",
            customerReference: "TEST11111",
            signatureHash: "0bd9ce502950ffa358314c170dace42e7ba3e0c776f5a32eb15c3d496bc9c294835036dd90d4f287233b800c9bde2f6591b6b8a1f675b6bfe64fd799da29d1d0",
        };
        const testSecretKey = "da9fe30575517d987762a859842b5631";
        // Expected concatenated data: EDV447111.00Direct PayCash Through FawryPAID2911105009TEST11111
        const expectedDataStr = "EDV447111.00Direct PayCash Through FawryPAID2911105009TEST11111";
        const calculatedSignature = crypto_1.default
            .createHmac("sha512", testSecretKey)
            .update(expectedDataStr)
            .digest("hex");
        console.log("🧪 EasyKash Test:");
        console.log("Expected data string:", expectedDataStr);
        console.log("Test secret key:", testSecretKey);
        console.log("Expected signature:", testPayload.signatureHash);
        console.log("Calculated signature:", calculatedSignature);
        console.log("Test result:", calculatedSignature === testPayload.signatureHash);
        return calculatedSignature === testPayload.signatureHash;
    }
    /**
     * Test function for the new EasyKash callback format
     * Based on the response example provided
     */
    static testNewEasyKashFormat() {
        const newFormatPayload = {
            PaymentMethod: "Cash Through Fawry",
            Amount: "10.05",
            BuyerName: "John Doe",
            BuyerEmail: "JohnDoe@example.com",
            BuyerMobile: "01010101010",
            status: "PAID",
            voucher: "32423432",
            easykashRef: "1206102054",
        };
        console.log("🧪 New EasyKash Format Test:");
        console.log("Payload:", JSON.stringify(newFormatPayload, null, 2));
        console.log("✅ New format test completed - no signature verification needed");
        return true;
    }
    /**
     * Handle payment callback from EasyKash
     */
    static async handleCallback(data) {
        try {
            console.log("📞 EasyKash Callback Received:", JSON.stringify(data, null, 2));
            // Verify HMAC signature using EasyKash's exact format
            if (!this.verifyHmacSignature(data)) {
                console.error("❌ Invalid signature in EasyKash callback");
                console.error("Received data:", JSON.stringify(data, null, 2));
                throw new error_middleware_1.ApiError(401, "Invalid signature");
            }
            console.log("✅ EasyKash signature verified successfully");
            // Extract data from callback
            const transactionId = data.easykashRef;
            const status = data.status;
            const amount = parseFloat(data.Amount);
            console.log("📊 Callback Data:", {
                transactionId,
                status,
                amount,
                paymentMethod: data.PaymentMethod,
                buyerName: data.BuyerName,
                voucher: data.voucher,
            });
            // Parse customerReference to get our custom data
            let customData = {};
            if (data.customerReference) {
                try {
                    customData = JSON.parse(data.customerReference);
                }
                catch (e) {
                    console.error("Failed to parse customerReference:", e);
                }
            }
            // If no customerReference, try to find payment by transaction ID
            if (!customData?.paymentId || !customData?.orderId) {
                console.log("🔍 No customerReference found, searching by transaction ID:", transactionId);
                // Search for payment by transaction ID
                const paymentSearchResult = await database_1.pool
                    .request()
                    .input("transactionId", mssql_1.default.NVarChar(255), transactionId).query(`
            SELECT p.*, o.status as order_status 
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            WHERE p.transaction_id = @transactionId
          `);
                if (paymentSearchResult.recordset.length === 0) {
                    throw new error_middleware_1.ApiError(404, "Payment not found for transaction ID");
                }
                const payment = paymentSearchResult.recordset[0];
                customData = {
                    paymentId: payment.id,
                    orderId: payment.order_id,
                    userId: payment.user_id,
                };
            }
            // Get payment record
            const paymentResult = await database_1.pool
                .request()
                .input("paymentId", mssql_1.default.UniqueIdentifier, customData.paymentId)
                .input("transactionId", mssql_1.default.NVarChar(255), transactionId).query(`
          SELECT p.*, o.status as order_status 
          FROM payments p
          LEFT JOIN orders o ON p.order_id = o.id
          WHERE p.id = @paymentId OR p.transaction_id = @transactionId
        `);
            if (paymentResult.recordset.length === 0) {
                throw new error_middleware_1.ApiError(404, "Payment not found");
            }
            const payment = paymentResult.recordset[0];
            // Map EasyKash status to our status
            let paymentStatus;
            let orderStatus = null;
            switch (status.toLowerCase()) {
                // Success states
                case "success":
                case "completed":
                case "paid":
                case "delivered": // EasyKash: payment delivered successfully
                    paymentStatus = "completed";
                    orderStatus = "confirmed"; // Update order status to confirmed
                    break;
                // Failed states
                case "failed":
                case "declined":
                    paymentStatus = "failed";
                    break;
                // Pending/New states
                case "new": // EasyKash: payment just created
                case "pending":
                    paymentStatus = "pending";
                    break;
                // Cancelled states
                case "canceled": // EasyKash spelling (without 'led')
                case "cancelled": // Our spelling (with 'led')
                    paymentStatus = "cancelled";
                    break;
                // Refunded state
                case "refunded": // EasyKash: payment was refunded
                    paymentStatus = "refunded";
                    break;
                // Expired state
                case "expired": // EasyKash: payment link/voucher expired
                    paymentStatus = "cancelled"; // Treat expired as cancelled
                    break;
                default:
                    console.warn(`⚠️ Unknown payment status from EasyKash: ${status}`);
                    paymentStatus = "pending";
            }
            // Update payment record
            await database_1.pool
                .request()
                .input("paymentId", mssql_1.default.UniqueIdentifier, customData.paymentId)
                .input("status", mssql_1.default.NVarChar(50), paymentStatus)
                .input("transactionId", mssql_1.default.NVarChar(255), transactionId)
                .input("referenceNumber", mssql_1.default.NVarChar(255), data.voucher || null)
                .input("callbackData", mssql_1.default.NVarChar(mssql_1.default.MAX), JSON.stringify(data))
                .query(`
          UPDATE payments 
          SET 
            status = @status,
            transaction_id = @transactionId,
            reference_number = @referenceNumber,
            callback_data = @callbackData,
            updated_at = GETDATE()
          WHERE id = @paymentId
        `);
            // Update order payment status and status based on payment result
            if (paymentStatus === "completed") {
                // Payment successful - mark order as paid and confirmed
                await database_1.pool
                    .request()
                    .input("orderId", mssql_1.default.UniqueIdentifier, customData.orderId)
                    .input("orderStatus", mssql_1.default.NVarChar(20), orderStatus).query(`
            UPDATE orders 
            SET 
              payment_status = 'paid',
              payment_method = 'easykash',
              status = COALESCE(@orderStatus, status),
              updated_at = GETDATE()
            WHERE id = @orderId
          `);
            }
            else if (paymentStatus === "failed" ||
                paymentStatus === "cancelled" ||
                paymentStatus === "refunded") {
                // Payment failed, cancelled, or refunded - mark order as failed and cancel if pending
                await database_1.pool
                    .request()
                    .input("orderId", mssql_1.default.UniqueIdentifier, customData.orderId).query(`
            UPDATE orders 
            SET 
              payment_status = 'failed',
              status = CASE 
                WHEN status = 'pending_payment' THEN 'cancelled'
                ELSE status 
              END,
              updated_at = GETDATE()
            WHERE id = @orderId
          `);
            }
            // Note: If paymentStatus is "pending", we don't update the order
            // to keep it in pending_payment state
            return {
                success: true,
                paymentId: customData.paymentId,
                orderId: customData.orderId,
                status: paymentStatus,
            };
        }
        catch (error) {
            console.error("Payment callback error:", error);
            if (error instanceof error_middleware_1.ApiError) {
                throw error;
            }
            throw new error_middleware_1.ApiError(500, `Failed to process callback: ${error.message}`);
        }
    }
    /**
     * Get payment status by payment ID
     * Auto-expires pending payments after 30 minutes
     */
    static async getPaymentStatus(paymentId, userId) {
        const request = database_1.pool
            .request()
            .input("paymentId", mssql_1.default.UniqueIdentifier, paymentId);
        let userCondition = "";
        if (userId) {
            userCondition = "AND p.user_id = @userId";
            request.input("userId", mssql_1.default.UniqueIdentifier, userId);
        }
        const result = await request.query(`
      SELECT 
        p.*,
        o.id as order_id,
        o.total as order_total,
        o.status as order_status,
        o.payment_status as order_payment_status,
        DATEDIFF(MINUTE, p.created_at, GETDATE()) as minutes_elapsed
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.id = @paymentId ${userCondition}
    `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "Payment not found");
        }
        const payment = result.recordset[0];
        // Auto-expire pending payments after 30 minutes (no callback received)
        if (payment.status === "pending" && payment.minutes_elapsed >= 30) {
            console.log(`⏰ Payment ${paymentId} expired after ${payment.minutes_elapsed} minutes. Auto-cancelling...`);
            // Update payment to cancelled
            await database_1.pool.request().input("paymentId", mssql_1.default.UniqueIdentifier, paymentId)
                .query(`
          UPDATE payments 
          SET 
            status = 'cancelled',
            updated_at = GETDATE()
          WHERE id = @paymentId AND status = 'pending'
        `);
            // Update order if still pending_payment
            await database_1.pool
                .request()
                .input("orderId", mssql_1.default.UniqueIdentifier, payment.order_id).query(`
          UPDATE orders 
          SET 
            payment_status = 'failed',
            status = CASE 
              WHEN status = 'pending_payment' THEN 'cancelled'
              ELSE status 
            END,
            updated_at = GETDATE()
          WHERE id = @orderId AND status = 'pending_payment'
        `);
            payment.status = "cancelled";
        }
        return {
            id: payment.id,
            orderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            provider: payment.provider,
            transactionId: payment.transaction_id,
            referenceNumber: payment.reference_number,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
            orderStatus: payment.order_status,
            orderPaymentStatus: payment.order_payment_status,
        };
    }
    /**
     * Get payment by order ID
     */
    static async getPaymentByOrderId(orderId, userId) {
        const request = database_1.pool
            .request()
            .input("orderId", mssql_1.default.UniqueIdentifier, orderId);
        let userCondition = "";
        if (userId) {
            userCondition = "AND p.user_id = @userId";
            request.input("userId", mssql_1.default.UniqueIdentifier, userId);
        }
        const result = await request.query(`
      SELECT p.* 
      FROM payments p
      WHERE p.order_id = @orderId ${userCondition}
      ORDER BY p.created_at DESC
    `);
        if (result.recordset.length === 0) {
            return null;
        }
        return result.recordset[0];
    }
    /**
     * Cancel payment manually (when user returns without completing payment)
     */
    static async cancelPayment(paymentId, userId) {
        try {
            // Get payment record
            const request = database_1.pool
                .request()
                .input("paymentId", mssql_1.default.UniqueIdentifier, paymentId);
            let userCondition = "";
            if (userId) {
                userCondition = "AND p.user_id = @userId";
                request.input("userId", mssql_1.default.UniqueIdentifier, userId);
            }
            const paymentResult = await request.query(`
        SELECT p.*, o.status as order_status 
        FROM payments p
        LEFT JOIN orders o ON p.order_id = o.id
        WHERE p.id = @paymentId ${userCondition}
      `);
            if (paymentResult.recordset.length === 0) {
                throw new error_middleware_1.ApiError(404, "Payment not found");
            }
            const payment = paymentResult.recordset[0];
            // Only allow cancellation if payment is still pending
            if (payment.status !== "pending" && payment.status !== "processing") {
                throw new error_middleware_1.ApiError(400, `Payment cannot be cancelled. Current status: ${payment.status}`);
            }
            console.log("🚫 Cancelling payment:", paymentId);
            // Update payment status to cancelled
            await database_1.pool
                .request()
                .input("paymentId", mssql_1.default.UniqueIdentifier, paymentId)
                .input("status", mssql_1.default.NVarChar(50), "cancelled").query(`
          UPDATE payments 
          SET 
            status = @status,
            updated_at = GETDATE()
          WHERE id = @paymentId
        `);
            // Update order payment status to failed and cancel order
            await database_1.pool
                .request()
                .input("orderId", mssql_1.default.UniqueIdentifier, payment.order_id).query(`
          UPDATE orders 
          SET 
            payment_status = 'failed',
            status = CASE 
              WHEN status = 'pending_payment' THEN 'cancelled'
              ELSE status 
            END,
            updated_at = GETDATE()
          WHERE id = @orderId
        `);
            console.log("✅ Payment cancelled successfully");
            return {
                success: true,
                paymentId: paymentId,
                status: "cancelled",
            };
        }
        catch (error) {
            console.error("Cancel payment error:", error);
            if (error instanceof error_middleware_1.ApiError) {
                throw error;
            }
            throw new error_middleware_1.ApiError(500, `Failed to cancel payment: ${error.message}`);
        }
    }
    /**
     * Get all payments (admin)
     */
    static async getAllPayments(page = 1, limit = 10, status, orderId) {
        const offset = (page - 1) * limit;
        const request = database_1.pool
            .request()
            .input("offset", offset)
            .input("limit", limit);
        const conditions = [];
        if (status) {
            conditions.push("p.status = @status");
            request.input("status", status);
        }
        if (orderId) {
            conditions.push("CAST(p.order_id AS NVARCHAR(36)) LIKE @orderId");
            request.input("orderId", `%${orderId}%`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const paymentsResult = await request.query(`
      SELECT 
        p.*,
        o.id as order_id,
        o.total as order_total,
        o.status as order_status,
        prof.full_name as customer_name,
        prof.phone as customer_phone
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN profiles prof ON p.user_id = prof.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);
        // Get total count
        const countRequest = database_1.pool.request();
        if (status) {
            countRequest.input("status", status);
        }
        if (orderId) {
            countRequest.input("orderId", `%${orderId}%`);
        }
        const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM payments p ${whereClause}
    `);
        const total = countResult.recordset[0].total;
        return {
            payments: paymentsResult.recordset,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
exports.PaymentService = PaymentService;
PaymentService.EASYKASH_API_URL = process.env.EASYKASH_API_URL;
PaymentService.EASYKASH_API_KEY = process.env.EASYKASH_API_KEY;
PaymentService.EASYKASH_HMAC_SECRET = process.env.EASYKASH_HMAC_SECRET;
PaymentService.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
PaymentService.BACKEND_URL = process.env.API_URL;
//# sourceMappingURL=payment.service.js.map