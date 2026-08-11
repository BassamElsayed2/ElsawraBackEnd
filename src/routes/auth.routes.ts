import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validation.middleware";
import { customerAuthMiddleware } from "../middleware/auth.middleware";
import {
  authLimiter,
  passwordResetLimiter,
} from "../middleware/rate-limit.middleware";
import {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validators";
import { z } from "zod";

const router = Router();

// Public routes (with rate limiting)
router.post(
  "/signup",
  authLimiter,
  validateBody(signUpSchema),
  AuthController.signUp,
);
router.post(
  "/signin",
  authLimiter,
  validateBody(signInSchema),
  AuthController.signIn,
);
router.post(
  "/google",
  authLimiter,
  validateBody(z.object({ idToken: z.string().min(1) })),
  AuthController.googleSignIn,
);
router.post(
  "/facebook",
  authLimiter,
  validateBody(z.object({ accessToken: z.string().min(1) })),
  AuthController.facebookSignIn,
);

// Check if phone exists (public)
router.post(
  "/check-phone",
  authLimiter,
  validateBody(z.object({ phone: z.string().min(1) })),
  AuthController.checkPhoneExists,
);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  AuthController.resetPassword,
);

// Protected routes
router.post("/signout", customerAuthMiddleware, AuthController.signOut);
router.get("/me", customerAuthMiddleware, AuthController.getMe);
router.put(
  "/profile",
  customerAuthMiddleware,
  validateBody(updateProfileSchema),
  AuthController.updateProfile,
);
router.put(
  "/change-password",
  customerAuthMiddleware,
  passwordResetLimiter,
  validateBody(changePasswordSchema),
  AuthController.changePassword,
);

export default router;
