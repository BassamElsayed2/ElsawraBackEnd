import express from "express";
import { qrcodeController } from "../controllers/qrcode.controller";
import { customerAuthMiddleware, dashboardAuthMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Get all QR Codes (admin only) - Must be before /:branchId route
router.get(
  "/all",
  dashboardAuthMiddleware,
  qrcodeController.getAllQRCodes
);

// Generate QR Code for a branch (admin only)
router.post(
  "/generate/:branchId",
  dashboardAuthMiddleware,
  qrcodeController.generateQRCode
);

// Get QR Code for a branch (public or authenticated)
router.get("/:branchId", qrcodeController.getQRCode);

// Delete QR Code (admin only)
router.delete(
  "/:branchId",
  dashboardAuthMiddleware,
  qrcodeController.deleteQRCode
);

export default router;
