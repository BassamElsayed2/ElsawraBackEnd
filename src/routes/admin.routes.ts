import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Get current admin profile
router.get("/profile", AdminController.getAdminProfile);

// Update admin profile
router.put("/profile", AdminController.updateAdminProfile);

// Get all admins (super_admin only)
router.get("/all", AdminController.getAllAdmins);

export default router;
