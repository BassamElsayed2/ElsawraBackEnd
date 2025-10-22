"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// User routes (require authentication)
router.post("/initiate", auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.initiatePayment);
router.get("/status/:id", auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.getPaymentStatus);
router.get("/order/:orderId", auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.getPaymentByOrderId);
router.post("/cancel/:id", auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.cancelPayment);
// EasyKash callback (no auth required - verified by HMAC)
router.post("/easykash/callback", payment_controller_1.PaymentController.handleEasyKashCallback);
// Admin routes
router.get("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, payment_controller_1.PaymentController.getAllPayments);
// Test routes (no auth required for testing)
router.get("/test-signature", payment_controller_1.PaymentController.testSignature);
router.get("/test-new-format", payment_controller_1.PaymentController.testNewFormat);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map