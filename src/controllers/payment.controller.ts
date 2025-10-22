import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { PaymentService } from "../services/payment.service";
import { asyncHandler } from "../middleware/error.middleware";
import { ApiError } from "../middleware/error.middleware";

export class PaymentController {
  /**
   * Initiate payment
   */
  static initiatePayment = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      const {
        order_id,
        amount,
        currency,
        customer_name,
        customer_email,
        customer_phone,
      } = req.body;

      // Validate required fields
      if (!order_id || !amount || !customer_name) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: order_id, amount, customer_name",
        });
      }

      const result = await PaymentService.initiatePayment(req.user.id, {
        order_id,
        amount,
        currency,
        customer_name,
        customer_email,
        customer_phone,
      });

      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: result,
      });
    }
  );

  /**
   * Handle EasyKash callback
   */
  static handleEasyKashCallback = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const callbackData = req.body;

      // Signature verification is handled in the service layer
      // EasyKash may send callbacks with or without signatureHash
      console.log(
        "📞 Callback received:",
        JSON.stringify(callbackData, null, 2)
      );

      const result = await PaymentService.handleCallback(callbackData);

      res.status(200).json({
        success: true,
        message: "Callback processed successfully",
        data: result,
      });
    }
  );

  /**
   * Get payment status
   */
  static getPaymentStatus = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user?.id;

      const payment = await PaymentService.getPaymentStatus(id, userId);

      res.json({
        success: true,
        data: payment,
      });
    }
  );

  /**
   * Get payment by order ID
   */
  static getPaymentByOrderId = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const payment = await PaymentService.getPaymentByOrderId(orderId, userId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found for this order",
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    }
  );

  /**
   * Cancel payment
   */
  static cancelPayment = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await PaymentService.cancelPayment(id, userId);

      res.json({
        success: true,
        message: "Payment cancelled successfully",
        data: result,
      });
    }
  );

  /**
   * Get all payments (admin)
   */
  static getAllPayments = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { page, limit, status, order_id } = req.query as any;

      const result = await PaymentService.getAllPayments(
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        order_id
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  /**
   * Test EasyKash signature verification
   */
  static testSignature = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const testResult = PaymentService.testEasyKashSignature();

      res.json({
        success: true,
        message: "EasyKash signature test completed",
        data: {
          testPassed: testResult,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * Test new EasyKash callback format
   */
  static testNewFormat = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const testResult = PaymentService.testNewEasyKashFormat();

      res.json({
        success: true,
        message: "New EasyKash format test completed",
        data: {
          testPassed: testResult,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}
