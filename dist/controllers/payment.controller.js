"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const error_middleware_1 = require("../middleware/error.middleware");
class PaymentController {
}
exports.PaymentController = PaymentController;
_a = PaymentController;
/**
 * Initiate payment
 */
PaymentController.initiatePayment = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
    }
    const { order_id, amount, currency, customer_name, customer_email, customer_phone, } = req.body;
    // Validate required fields
    if (!order_id || !amount || !customer_name) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: order_id, amount, customer_name",
        });
    }
    const result = await payment_service_1.PaymentService.initiatePayment(req.user.id, {
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
});
/**
 * Handle EasyKash callback
 */
PaymentController.handleEasyKashCallback = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const callbackData = req.body;
    // Signature verification is handled in the service layer
    // EasyKash may send callbacks with or without signatureHash
    console.log("📞 Callback received:", JSON.stringify(callbackData, null, 2));
    const result = await payment_service_1.PaymentService.handleCallback(callbackData);
    res.status(200).json({
        success: true,
        message: "Callback processed successfully",
        data: result,
    });
});
/**
 * Get payment status
 */
PaymentController.getPaymentStatus = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const payment = await payment_service_1.PaymentService.getPaymentStatus(id, userId);
    res.json({
        success: true,
        data: payment,
    });
});
/**
 * Get payment by order ID
 */
PaymentController.getPaymentByOrderId = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const payment = await payment_service_1.PaymentService.getPaymentByOrderId(orderId, userId);
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
});
/**
 * Cancel payment
 */
PaymentController.cancelPayment = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const result = await payment_service_1.PaymentService.cancelPayment(id, userId);
    res.json({
        success: true,
        message: "Payment cancelled successfully",
        data: result,
    });
});
/**
 * Get all payments (admin)
 */
PaymentController.getAllPayments = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { page, limit, status, order_id } = req.query;
    const result = await payment_service_1.PaymentService.getAllPayments(parseInt(page) || 1, parseInt(limit) || 10, status, order_id);
    res.json({
        success: true,
        data: result,
    });
});
/**
 * Test EasyKash signature verification
 */
PaymentController.testSignature = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const testResult = payment_service_1.PaymentService.testEasyKashSignature();
    res.json({
        success: true,
        message: "EasyKash signature test completed",
        data: {
            testPassed: testResult,
            timestamp: new Date().toISOString(),
        },
    });
});
/**
 * Test new EasyKash callback format
 */
PaymentController.testNewFormat = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const testResult = payment_service_1.PaymentService.testNewEasyKashFormat();
    res.json({
        success: true,
        message: "New EasyKash format test completed",
        data: {
            testPassed: testResult,
            timestamp: new Date().toISOString(),
        },
    });
});
//# sourceMappingURL=payment.controller.js.map