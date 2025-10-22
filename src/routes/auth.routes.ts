import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validation.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  authLimiter,
  passwordResetLimiter,
} from "../middleware/rate-limit.middleware";
import {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validators";
import { z } from "zod";

const router = Router();

// Public routes (with rate limiting)
router.post(
  "/signup",
  authLimiter,
  validateBody(signUpSchema),
  AuthController.signUp
);
router.post(
  "/signin",
  authLimiter,
  validateBody(signInSchema),
  AuthController.signIn
);
router.post(
  "/google",
  authLimiter,
  validateBody(z.object({ idToken: z.string().min(1) })),
  AuthController.googleSignIn
);

// Check if phone exists (public)
router.post(
  "/check-phone",
  validateBody(z.object({ phone: z.string().min(1) })),
  AuthController.checkPhoneExists
);

// Protected routes
router.post("/signout", authMiddleware, AuthController.signOut);
router.get("/me", authMiddleware, AuthController.getMe);
router.put(
  "/profile",
  authMiddleware,
  validateBody(updateProfileSchema),
  AuthController.updateProfile
);
router.put(
  "/change-password",
  authMiddleware,
  passwordResetLimiter,
  validateBody(changePasswordSchema),
  AuthController.changePassword
);

export default router;
