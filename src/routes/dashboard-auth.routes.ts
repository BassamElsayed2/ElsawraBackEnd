import { Router } from "express";
import { DashboardAuthController } from "../controllers/dashboard-auth.controller";
import { validateBody } from "../middleware/validation.middleware";
import { dashboardAuthMiddleware } from "../middleware/auth.middleware";
import {
  authLimiter,
  passwordResetLimiter,
} from "../middleware/rate-limit.middleware";
import {
  signInSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validators";

const router = Router();

router.post(
  "/signin",
  authLimiter,
  validateBody(signInSchema),
  DashboardAuthController.signIn,
);

router.post(
  "/signout",
  dashboardAuthMiddleware,
  DashboardAuthController.signOut,
);
router.get("/me", dashboardAuthMiddleware, DashboardAuthController.getMe);
router.put(
  "/profile",
  dashboardAuthMiddleware,
  validateBody(updateProfileSchema),
  DashboardAuthController.updateProfile,
);
router.put(
  "/change-password",
  dashboardAuthMiddleware,
  passwordResetLimiter,
  validateBody(changePasswordSchema),
  DashboardAuthController.changePassword,
);

export default router;
