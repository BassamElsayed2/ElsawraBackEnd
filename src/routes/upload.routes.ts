import express from "express";
import { uploadController } from "../controllers/upload.controller";
import { uploadSingle } from "../middleware/upload.middleware";
import { customerAuthMiddleware, dashboardAuthMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Generic image upload (admin only)
router.post(
  "/image",
  dashboardAuthMiddleware,
  uploadSingle("image"),
  uploadController.uploadImage
);

// Delete image (admin only)
router.delete(
  "/image",
  dashboardAuthMiddleware,
  uploadController.deleteImage
);

export default router;
