import express from "express";
import { qrcodeController } from "../controllers/qrcode.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Generate QR Code for a branch (admin only)
router.post(
  "/generate/:branchId",
  authMiddleware,
  adminMiddleware,
  qrcodeController.generateQRCode
);

// Get QR Code for a branch (public or authenticated)
router.get("/:branchId", qrcodeController.getQRCode);

// Get all QR Codes (admin only)
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  qrcodeController.getAllQRCodes
);

// Delete QR Code (admin only)
router.delete(
  "/:branchId",
  authMiddleware,
  adminMiddleware,
  qrcodeController.deleteQRCode
);

export default router;
