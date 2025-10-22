import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

// User routes (require authentication)
router.post("/initiate", authMiddleware, PaymentController.initiatePayment);
router.get("/status/:id", authMiddleware, PaymentController.getPaymentStatus);
router.get(
  "/order/:orderId",
  authMiddleware,
  PaymentController.getPaymentByOrderId
);
router.post("/cancel/:id", authMiddleware, PaymentController.cancelPayment);

// EasyKash callback (no auth required - verified by HMAC)
router.post("/easykash/callback", PaymentController.handleEasyKashCallback);

// Admin routes
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  PaymentController.getAllPayments
);

// Test routes (no auth required for testing)
router.get("/test-signature", PaymentController.testSignature);
router.get("/test-new-format", PaymentController.testNewFormat);

export default router;
