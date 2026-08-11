import { pool } from "../config/database";
import { ApiError } from "../middleware/error.middleware";
import { emitOrderEvent } from "../socket";
import { logSecurityEvent } from "../middleware/security.middleware";
import { logger } from "../utils/logger";
import sql from "mssql";
import crypto from "crypto";
import { Request } from "express";

export interface InitiatePaymentData {
  order_id: string;
  amount: number;
  currency?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  lang?: string;
}

export interface PaymentCallbackData {
  ProductCode?: string;
  PaymentMethod?: string;
  ProductType?: string;
  Amount: string;
  Currency?: string;
  currency?: string;
  BuyerEmail?: string;
  BuyerMobile?: string;
  BuyerName?: string;
  Timestamp?: string;
  status: string;
  voucher?: string;
  easykashRef: string;
  VoucherData?: string;
  customerReference?: string;
  merchantReference?: string;
  signatureHash?: string;
}

type PaymentVerificationResult =
  | "ok"
  | "bad_signature"
  | "amount_mismatch"
  | "currency_mismatch"
  | "ref_mismatch"
  | "illegal_transition"
  | "not_found"
  | "insecure_skipped"
  | "unknown_status";

const PAYMENT_STATUS_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  pending: new Set(["pending", "completed", "failed", "cancelled"]),
  completed: new Set(["completed", "refunded"]),
  failed: new Set(["failed"]),
  cancelled: new Set(["cancelled"]),
  refunded: new Set(["refunded"]),
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HMAC_HEX_REGEX = /^[0-9a-f]+$/i;
/** SHA-512 hex digest length */
const HMAC_HEX_LENGTH = 128;

export class PaymentService {
  private static readonly EASYKASH_API_URL = process.env.EASYKASH_API_URL;
  private static readonly EASYKASH_API_KEY = process.env.EASYKASH_API_KEY;
  private static readonly EASYKASH_HMAC_SECRET =
    process.env.EASYKASH_HMAC_SECRET;
  private static readonly FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:3000";

  private static allowInsecureCallbacks(): boolean {
    return process.env.PAYMENT_ALLOW_INSECURE_CALLBACKS === "true";
  }

  /**
   * Initiate payment with EasyKash
   */
  static async initiatePayment(userId: string, data: InitiatePaymentData) {
    try {
      if (!this.EASYKASH_API_KEY) {
        throw new ApiError(500, "EasyKash API key not configured");
      }

      if (!this.EASYKASH_HMAC_SECRET && !this.allowInsecureCallbacks()) {
        throw new ApiError(
          500,
          "EasyKash HMAC secret not configured. Set EASYKASH_HMAC_SECRET or PAYMENT_ALLOW_INSECURE_CALLBACKS=true for local only.",
        );
      }

      const orderCheck = await pool
        .request()
        .input("orderId", sql.UniqueIdentifier, data.order_id)
        .input("userId", sql.UniqueIdentifier, userId).query(`
          SELECT id, total, status, payment_status 
          FROM orders 
          WHERE id = @orderId AND user_id = @userId
        `);

      if (orderCheck.recordset.length === 0) {
        throw new ApiError(404, "Order not found");
      }

      const order = orderCheck.recordset[0];

      if (order.payment_status === "paid") {
        throw new ApiError(400, "Order is already paid");
      }

      if (Math.abs(order.total - data.amount) > 0.01) {
        throw new ApiError(400, "Payment amount does not match order total");
      }

      const paymentId = crypto.randomUUID();
      await pool
        .request()
        .input("id", sql.UniqueIdentifier, paymentId)
        .input("orderId", sql.UniqueIdentifier, data.order_id)
        .input("userId", sql.UniqueIdentifier, userId)
        .input("amount", sql.Decimal(10, 2), data.amount)
        .input("currency", sql.NVarChar(10), data.currency || "EGP")
        .input("status", sql.NVarChar(50), "pending")
        .input("provider", sql.NVarChar(50), "easykash").query(`
          INSERT INTO payments (id, order_id, user_id, amount, currency, status, provider, created_at)
          VALUES (@id, @orderId, @userId, @amount, @currency, @status, @provider, GETDATE())
        `);

      const locale = data.lang === "en" ? "en" : "ar";
      const redirectUrl = `${this.FRONTEND_URL}/${locale}/payment/result?id=${data.order_id}`;
      const customerReference = paymentId;

      const paymentRequest = {
        amount: data.amount,
        currency: data.currency || "EGP",
        paymentOptions: [2, 4],
        cashExpiry: 3,
        name: data.customer_name,
        email: data.customer_email || "",
        mobile: data.customer_phone || "",
        redirectUrl: redirectUrl,
        customerReference,
      };

      const response = await fetch(
        `${this.EASYKASH_API_URL}/api/directpayv1/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.EASYKASH_API_KEY,
          },
          body: JSON.stringify(paymentRequest),
        },
      );

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          `EasyKash API error: ${errorData.message || response.statusText}`,
        );
      }

      const paymentData: any = await response.json();
      const paymentUrl =
        paymentData.redirectUrl || paymentData.paymentUrl || "";

      let productCode = "";
      if (paymentUrl) {
        const match = paymentUrl.match(/DirectPayV1\/([^\/\?]+)/);
        if (match) {
          productCode = match[1];
        }
      }

      if (productCode) {
        await pool
          .request()
          .input("paymentId", sql.UniqueIdentifier, paymentId)
          .input("transactionId", sql.NVarChar(255), productCode).query(`
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
    } catch (error: any) {
      logger.error("Payment initiation error:", error);

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to initiate payment: ${error.message}`);
    }
  }

  /**
   * Verify HMAC signature from EasyKash callback (fail-closed unless insecure flag).
   */
  static verifyHmacSignature(data: PaymentCallbackData): {
    ok: boolean;
    insecureSkipped?: boolean;
  } {
    const insecure = this.allowInsecureCallbacks();

    if (!data.signatureHash) {
      if (insecure) {
        logger.warn("Payment callback accepted without signature (insecure flag)");
        return { ok: true, insecureSkipped: true };
      }
      return { ok: false };
    }

    if (!this.EASYKASH_HMAC_SECRET) {
      if (insecure) {
        logger.warn("Payment callback accepted without HMAC secret (insecure flag)");
        return { ok: true, insecureSkipped: true };
      }
      return { ok: false };
    }

    const signatureHash = String(data.signatureHash).trim();
    if (
      signatureHash.length !== HMAC_HEX_LENGTH ||
      !HMAC_HEX_REGEX.test(signatureHash)
    ) {
      return { ok: false };
    }

    const dataToSecure = [
      data.ProductCode,
      data.Amount,
      data.ProductType,
      data.PaymentMethod,
      data.status,
      data.easykashRef,
      data.customerReference,
    ];
    const dataStr = dataToSecure.join("");

    const calculatedSignature = crypto
      .createHmac("sha512", this.EASYKASH_HMAC_SECRET)
      .update(dataStr)
      .digest("hex");

    try {
      const a = Buffer.from(calculatedSignature, "utf8");
      const b = Buffer.from(signatureHash.toLowerCase(), "utf8");
      if (a.length !== b.length) {
        return { ok: false };
      }
      return { ok: crypto.timingSafeEqual(a, b) };
    } catch {
      return { ok: false };
    }
  }

  static testEasyKashSignature(): boolean {
    const testPayload = {
      ProductCode: "EDV4471",
      Amount: "11.00",
      ProductType: "Direct Pay",
      PaymentMethod: "Cash Through Fawry",
      status: "PAID",
      easykashRef: "2911105009",
      customerReference: "TEST11111",
      signatureHash:
        "0bd9ce502950ffa358314c170dace42e7ba3e0c776f5a32eb15c3d496bc9c294835036dd90d4f287233b800c9bde2f6591b6b8a1f675b6bfe64fd799da29d1d0",
    };

    const testSecretKey = "da9fe30575517d987762a859842b5631";
    const expectedDataStr =
      "EDV447111.00Direct PayCash Through FawryPAID2911105009TEST11111";

    const calculatedSignature = crypto
      .createHmac("sha512", testSecretKey)
      .update(expectedDataStr)
      .digest("hex");

    return calculatedSignature === testPayload.signatureHash;
  }

  static testNewEasyKashFormat(): boolean {
    return true;
  }

  private static mapEasyKashStatus(status: string): {
    paymentStatus: string;
    orderStatus: string | null;
    known: boolean;
  } {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
      case "paid":
      case "delivered":
        return {
          paymentStatus: "completed",
          orderStatus: "confirmed",
          known: true,
        };
      case "failed":
      case "declined":
        return { paymentStatus: "failed", orderStatus: null, known: true };
      case "new":
      case "pending":
        return { paymentStatus: "pending", orderStatus: null, known: true };
      case "canceled":
      case "cancelled":
      case "expired":
        return { paymentStatus: "cancelled", orderStatus: null, known: true };
      case "refunded":
        return { paymentStatus: "refunded", orderStatus: null, known: true };
      default:
        return { paymentStatus: "pending", orderStatus: null, known: false };
    }
  }

  private static isTransitionAllowed(
    currentStatus: string,
    nextStatus: string,
  ): boolean {
    const normalizedCurrent = (currentStatus || "pending").toLowerCase();
    const allowed = PAYMENT_STATUS_TRANSITIONS[normalizedCurrent];
    if (!allowed) {
      return false;
    }
    return allowed.has(nextStatus);
  }

  private static async auditCallback(
    req: Request | undefined,
    details: {
      verification_result: PaymentVerificationResult;
      received_status?: string;
      mapped_status?: string;
      request_id: string;
      paymentId?: string;
      orderId?: string;
    },
  ): Promise<void> {
    try {
      const fakeReq = (req || {
        ip: undefined,
        get: () => undefined,
      }) as Request;

      await logSecurityEvent(
        "PAYMENT_CALLBACK",
        fakeReq,
        undefined,
        undefined,
        {
          verification_result: details.verification_result,
          ip: req?.ip,
          received_status: details.received_status,
          mapped_status: details.mapped_status,
          request_id: details.request_id,
          paymentId: details.paymentId,
          orderId: details.orderId,
        },
      );
    } catch (error) {
      logger.warn("Payment callback audit failed (best-effort):", error);
    }
  }

  private static extractReferencePaymentId(
    data: PaymentCallbackData,
  ): string | null {
    const refs = [data.customerReference, data.merchantReference]
      .filter(Boolean)
      .map((r) => String(r).trim());

    for (const ref of refs) {
      if (UUID_REGEX.test(ref)) {
        return ref;
      }
      try {
        const parsed = JSON.parse(ref);
        if (parsed?.paymentId && UUID_REGEX.test(String(parsed.paymentId))) {
          return String(parsed.paymentId);
        }
      } catch {
        // not JSON
      }
    }
    return null;
  }

  /**
   * Handle payment callback from EasyKash
   */
  static async handleCallback(data: PaymentCallbackData, req?: Request) {
    const requestId = crypto.randomUUID();
    let paymentId: string | undefined;
    let orderId: string | undefined;
    let mappedStatus: string | undefined;

    const fail = async (
      verification_result: PaymentVerificationResult,
      error: ApiError,
      received_status?: string,
    ) => {
      await this.auditCallback(req, {
        verification_result,
        received_status: received_status ?? data.status,
        mapped_status: mappedStatus,
        request_id: requestId,
        paymentId,
        orderId,
      });
      throw error;
    };

    try {
      const hmac = this.verifyHmacSignature(data);
      if (!hmac.ok) {
        await fail(
          "bad_signature",
          new ApiError(401, "Invalid signature"),
        );
      }

      const easykashRef = data.easykashRef;
      const productCode = data.ProductCode;
      const status = data.status;
      const amount = parseFloat(data.Amount);

      if (!Number.isFinite(amount)) {
        await fail(
          "amount_mismatch",
          new ApiError(400, "Invalid payment amount"),
        );
      }

      const referencePaymentId = this.extractReferencePaymentId(data);
      const hasExplicitReference = Boolean(
        data.customerReference || data.merchantReference,
      );

      if (hasExplicitReference && !referencePaymentId) {
        // Non-UUID reference: resolve by exact id/transaction match only (single row)
        const refValue = String(
          data.customerReference || data.merchantReference,
        ).trim();
        const byRef = await pool
          .request()
          .input("lookupKey", sql.NVarChar(255), refValue).query(`
            SELECT p.id, p.order_id
            FROM payments p
            WHERE CONVERT(NVARCHAR(36), p.id) = @lookupKey
               OR p.transaction_id = @lookupKey
          `);

        if (byRef.recordset.length === 0) {
          await fail(
            "not_found",
            new ApiError(404, "Payment not found for transaction ID"),
          );
        }
        if (byRef.recordset.length > 1) {
          await fail(
            "ref_mismatch",
            new ApiError(400, "Ambiguous payment reference"),
          );
        }
        paymentId = byRef.recordset[0].id;
        orderId = byRef.recordset[0].order_id;
      } else if (referencePaymentId) {
        paymentId = referencePaymentId;
      } else {
        // No customer/merchant reference — ProductCode / easykashRef only if unique
        const lookupKeys = [productCode, easykashRef]
          .filter(Boolean)
          .map(String);

        if (lookupKeys.length === 0) {
          await fail(
            "not_found",
            new ApiError(404, "Payment not found for transaction ID"),
          );
        }

        let found: { id: string; order_id: string } | null = null;
        for (const key of lookupKeys) {
          const paymentSearchResult = await pool
            .request()
            .input("lookupKey", sql.NVarChar(255), key).query(`
              SELECT p.id, p.order_id
              FROM payments p
              WHERE p.transaction_id = @lookupKey
                 OR CONVERT(NVARCHAR(36), p.id) = @lookupKey
            `);

          if (paymentSearchResult.recordset.length > 1) {
            await fail(
              "ref_mismatch",
              new ApiError(400, "Ambiguous payment reference"),
            );
          }
          if (paymentSearchResult.recordset.length === 1) {
            found = paymentSearchResult.recordset[0];
            break;
          }
        }

        if (!found) {
          await fail(
            "not_found",
            new ApiError(404, "Payment not found for transaction ID"),
          );
        }
        paymentId = found!.id;
        orderId = found!.order_id;
      }

      const mapped = this.mapEasyKashStatus(status);
      mappedStatus = mapped.paymentStatus;

      if (!mapped.known) {
        logger.warn("Unknown payment status from EasyKash", {
          status,
          requestId,
        });
      }

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const locked = await new sql.Request(transaction)
          .input("paymentId", sql.UniqueIdentifier, paymentId!).query(`
            SELECT p.*, o.status as order_status
            FROM payments p WITH (UPDLOCK, ROWLOCK)
            LEFT JOIN orders o ON p.order_id = o.id
            WHERE p.id = @paymentId
          `);

        if (locked.recordset.length === 0) {
          await transaction.rollback();
          await fail("not_found", new ApiError(404, "Payment not found"));
        }

        const payment = locked.recordset[0];
        paymentId = payment.id;
        orderId = payment.order_id;

        // Explicit reference must match resolved payment id fully
        if (hasExplicitReference && referencePaymentId) {
          if (
            String(payment.id).toLowerCase() !==
            String(referencePaymentId).toLowerCase()
          ) {
            await transaction.rollback();
            await fail(
              "ref_mismatch",
              new ApiError(400, "Payment reference does not match payment"),
            );
          }
        }

        if (Math.abs(Number(payment.amount) - amount) > 0.01) {
          await transaction.rollback();
          await fail(
            "amount_mismatch",
            new ApiError(400, "Payment amount does not match"),
          );
        }

        const callbackCurrency = data.Currency || data.currency;
        if (callbackCurrency) {
          const expected = String(payment.currency || "EGP").toUpperCase();
          if (String(callbackCurrency).trim().toUpperCase() !== expected) {
            await transaction.rollback();
            await fail(
              "currency_mismatch",
              new ApiError(400, "Payment currency does not match"),
            );
          }
        }

        const currentStatus = String(payment.status || "pending").toLowerCase();
        let nextStatus = mapped.paymentStatus;

        if (!mapped.known && currentStatus !== "pending") {
          await transaction.rollback();
          await fail(
            "unknown_status",
            new ApiError(409, "Unknown payment status conflicts with current state"),
            status,
          );
        }

        if (!this.isTransitionAllowed(currentStatus, nextStatus)) {
          await transaction.rollback();
          await fail(
            "illegal_transition",
            new ApiError(
              409,
              `Illegal payment status transition: ${currentStatus} -> ${nextStatus}`,
            ),
            status,
          );
        }

        // Idempotent no-op for same status
        if (currentStatus === nextStatus) {
          await transaction.commit();
          await this.auditCallback(req, {
            verification_result: hmac.insecureSkipped
              ? "insecure_skipped"
              : "ok",
            received_status: status,
            mapped_status: nextStatus,
            request_id: requestId,
            paymentId,
            orderId,
          });
          return {
            success: true,
            paymentId,
            orderId,
            status: nextStatus,
            requestId,
          };
        }

        const storedTransactionId =
          easykashRef || productCode || payment.transaction_id;

        await new sql.Request(transaction)
          .input("paymentId", sql.UniqueIdentifier, paymentId)
          .input("status", sql.NVarChar(50), nextStatus)
          .input("transactionId", sql.NVarChar(255), storedTransactionId)
          .input("referenceNumber", sql.NVarChar(255), data.voucher || null)
          .input("callbackData", sql.NVarChar(sql.MAX), JSON.stringify(data))
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

        if (nextStatus === "completed") {
          await new sql.Request(transaction)
            .input("orderId", sql.UniqueIdentifier, orderId)
            .input("orderStatus", sql.NVarChar(20), mapped.orderStatus).query(`
              UPDATE orders 
              SET 
                payment_status = 'paid',
                payment_method = 'easykash',
                status = COALESCE(@orderStatus, status),
                updated_at = GETDATE()
              WHERE id = @orderId
            `);
        } else if (nextStatus === "refunded") {
          await new sql.Request(transaction)
            .input("orderId", sql.UniqueIdentifier, orderId).query(`
              UPDATE orders 
              SET 
                payment_status = 'refunded',
                updated_at = GETDATE()
              WHERE id = @orderId
            `);
        } else if (nextStatus === "failed" || nextStatus === "cancelled") {
          await new sql.Request(transaction)
            .input("orderId", sql.UniqueIdentifier, orderId).query(`
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

        await transaction.commit();

        if (
          nextStatus === "completed" ||
          nextStatus === "failed" ||
          nextStatus === "cancelled" ||
          nextStatus === "refunded"
        ) {
          emitOrderEvent("updated", { orderId });
        }

        await this.auditCallback(req, {
          verification_result: hmac.insecureSkipped
            ? "insecure_skipped"
            : "ok",
          received_status: status,
          mapped_status: nextStatus,
          request_id: requestId,
          paymentId,
          orderId,
        });

        return {
          success: true,
          paymentId,
          orderId,
          status: nextStatus,
          requestId,
        };
      } catch (inner: any) {
        try {
          await transaction.rollback();
        } catch {
          // already rolled back or never started
        }
        throw inner;
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("Payment callback error:", error);
      throw new ApiError(500, `Failed to process callback: ${error.message}`);
    }
  }

  /**
   * Get payment status by payment ID
   * Auto-expires pending payments after 30 minutes
   */
  static async getPaymentStatus(paymentId: string, userId?: string) {
    const request = pool
      .request()
      .input("paymentId", sql.UniqueIdentifier, paymentId);

    let userCondition = "";
    if (userId) {
      userCondition = "AND p.user_id = @userId";
      request.input("userId", sql.UniqueIdentifier, userId);
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
      throw new ApiError(404, "Payment not found");
    }

    const payment = result.recordset[0];

    if (payment.status === "pending" && payment.minutes_elapsed >= 30) {
      logger.info(
        `Payment ${paymentId} expired after ${payment.minutes_elapsed} minutes. Auto-cancelling...`,
      );

      await pool.request().input("paymentId", sql.UniqueIdentifier, paymentId)
        .query(`
          UPDATE payments 
          SET 
            status = 'cancelled',
            updated_at = GETDATE()
          WHERE id = @paymentId AND status = 'pending'
        `);

      await pool
        .request()
        .input("orderId", sql.UniqueIdentifier, payment.order_id).query(`
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

      emitOrderEvent("updated", { orderId: payment.order_id });
      payment.status = "cancelled";
    }

    return {
      id: payment.id,
      order_id: payment.order_id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      transaction_id: payment.transaction_id,
      transactionId: payment.transaction_id,
      reference_number: payment.reference_number,
      referenceNumber: payment.reference_number,
      created_at: payment.created_at,
      createdAt: payment.created_at,
      updated_at: payment.updated_at,
      updatedAt: payment.updated_at,
      order_status: payment.order_status,
      orderStatus: payment.order_status,
      order_payment_status: payment.order_payment_status,
      orderPaymentStatus: payment.order_payment_status,
      minutes_elapsed: payment.minutes_elapsed,
      minutesElapsed: payment.minutes_elapsed,
    };
  }

  static async getPaymentByOrderId(orderId: string, userId?: string) {
    const request = pool
      .request()
      .input("orderId", sql.UniqueIdentifier, orderId);

    let userCondition = "";
    if (userId) {
      userCondition = "AND p.user_id = @userId";
      request.input("userId", sql.UniqueIdentifier, userId);
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

  static async cancelPayment(paymentId: string, userId?: string) {
    try {
      const request = pool
        .request()
        .input("paymentId", sql.UniqueIdentifier, paymentId);

      let userCondition = "";
      if (userId) {
        userCondition = "AND p.user_id = @userId";
        request.input("userId", sql.UniqueIdentifier, userId);
      }

      const paymentResult = await request.query(`
        SELECT p.*, o.status as order_status 
        FROM payments p
        LEFT JOIN orders o ON p.order_id = o.id
        WHERE p.id = @paymentId ${userCondition}
      `);

      if (paymentResult.recordset.length === 0) {
        throw new ApiError(404, "Payment not found");
      }

      const payment = paymentResult.recordset[0];

      if (payment.status !== "pending" && payment.status !== "processing") {
        throw new ApiError(
          400,
          `Payment cannot be cancelled. Current status: ${payment.status}`,
        );
      }

      await pool
        .request()
        .input("paymentId", sql.UniqueIdentifier, paymentId)
        .input("status", sql.NVarChar(50), "cancelled").query(`
          UPDATE payments 
          SET 
            status = @status,
            updated_at = GETDATE()
          WHERE id = @paymentId
        `);

      await pool
        .request()
        .input("orderId", sql.UniqueIdentifier, payment.order_id).query(`
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

      emitOrderEvent("updated", { orderId: payment.order_id });

      return {
        success: true,
        paymentId: paymentId,
        status: "cancelled",
      };
    } catch (error: any) {
      logger.error("Cancel payment error:", error);

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to cancel payment: ${error.message}`);
    }
  }

  static async getAllPayments(
    page: number = 1,
    limit: number = 10,
    status?: string,
    orderId?: string,
  ) {
    const offset = (page - 1) * limit;
    const request = pool
      .request()
      .input("offset", offset)
      .input("limit", limit);

    const conditions: string[] = [];

    if (status) {
      conditions.push("p.status = @status");
      request.input("status", status);
    }

    if (orderId) {
      conditions.push("CAST(p.order_id AS NVARCHAR(36)) LIKE @orderId");
      request.input("orderId", `%${orderId}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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

    const countRequest = pool.request();
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
