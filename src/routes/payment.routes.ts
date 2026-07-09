import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { customerAuthMiddleware, dashboardAuthMiddleware } from "../middleware/auth.middleware";
import { developmentOnly } from "../middleware/development.middleware";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

// User routes (require authentication)
router.post("/initiate", customerAuthMiddleware, PaymentController.initiatePayment);
router.get("/status/:id", customerAuthMiddleware, PaymentController.getPaymentStatus);
router.get(
  "/order/:orderId",
  customerAuthMiddleware,
  PaymentController.getPaymentByOrderId
);
router.post("/cancel/:id", customerAuthMiddleware, PaymentController.cancelPayment);

// EasyKash callback (no auth required - verified by HMAC)
router.post("/easykash/callback", PaymentController.handleEasyKashCallback);

// Admin routes
router.get(
  "/",
  dashboardAuthMiddleware,
  PaymentController.getAllPayments
);

// Dev-only payment test routes (blocked in production)
if (!isProduction) {
  router.get(
    "/test-signature",
    developmentOnly,
    PaymentController.testSignature
  );
  router.get(
    "/test-new-format",
    developmentOnly,
    PaymentController.testNewFormat
  );
}

export default router;
