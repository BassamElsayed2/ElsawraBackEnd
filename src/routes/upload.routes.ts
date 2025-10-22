import express from "express";
import { uploadController } from "../controllers/upload.controller";
import { uploadSingle } from "../middleware/upload.middleware";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Generic image upload (admin only)
router.post(
  "/image",
  authMiddleware,
  adminMiddleware,
  uploadSingle("image"),
  uploadController.uploadImage
);

// Delete image (admin only)
router.delete(
  "/image",
  authMiddleware,
  adminMiddleware,
  uploadController.deleteImage
);

export default router;
