"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const development_middleware_1 = require("../middleware/development.middleware");
const router = (0, express_1.Router)();
const isProduction = process.env.NODE_ENV === "production";
// User routes (require authentication)
router.post("/initiate", auth_middleware_1.customerAuthMiddleware, payment_controller_1.PaymentController.initiatePayment);
router.get("/status/:id", auth_middleware_1.customerAuthMiddleware, payment_controller_1.PaymentController.getPaymentStatus);
router.get("/order/:orderId", auth_middleware_1.customerAuthMiddleware, payment_controller_1.PaymentController.getPaymentByOrderId);
router.post("/cancel/:id", auth_middleware_1.customerAuthMiddleware, payment_controller_1.PaymentController.cancelPayment);
// EasyKash callback (no auth required - verified by HMAC)
router.post("/easykash/callback", payment_controller_1.PaymentController.handleEasyKashCallback);
// Admin routes
router.get("/", auth_middleware_1.dashboardAuthMiddleware, payment_controller_1.PaymentController.getAllPayments);
// Dev-only payment test routes (blocked in production)
if (!isProduction) {
    router.get("/test-signature", development_middleware_1.developmentOnly, payment_controller_1.PaymentController.testSignature);
    router.get("/test-new-format", development_middleware_1.developmentOnly, payment_controller_1.PaymentController.testNewFormat);
}
exports.default = router;
//# sourceMappingURL=payment.routes.js.map