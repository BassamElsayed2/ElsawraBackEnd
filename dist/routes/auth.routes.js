"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const auth_validators_1 = require("../validators/auth.validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Public routes (with rate limiting)
router.post("/signup", rate_limit_middleware_1.authLimiter, (0, validation_middleware_1.validateBody)(auth_validators_1.signUpSchema), auth_controller_1.AuthController.signUp);
router.post("/signin", rate_limit_middleware_1.authLimiter, (0, validation_middleware_1.validateBody)(auth_validators_1.signInSchema), auth_controller_1.AuthController.signIn);
router.post("/google", rate_limit_middleware_1.authLimiter, (0, validation_middleware_1.validateBody)(zod_1.z.object({ idToken: zod_1.z.string().min(1) })), auth_controller_1.AuthController.googleSignIn);
router.post("/facebook", rate_limit_middleware_1.authLimiter, (0, validation_middleware_1.validateBody)(zod_1.z.object({ accessToken: zod_1.z.string().min(1) })), auth_controller_1.AuthController.facebookSignIn);
// Check if phone exists (public)
router.post("/check-phone", (0, validation_middleware_1.validateBody)(zod_1.z.object({ phone: zod_1.z.string().min(1) })), auth_controller_1.AuthController.checkPhoneExists);
// Protected routes
router.post("/signout", auth_middleware_1.authMiddleware, auth_controller_1.AuthController.signOut);
router.get("/me", auth_middleware_1.authMiddleware, auth_controller_1.AuthController.getMe);
router.put("/profile", auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateBody)(auth_validators_1.updateProfileSchema), auth_controller_1.AuthController.updateProfile);
router.put("/change-password", auth_middleware_1.authMiddleware, rate_limit_middleware_1.passwordResetLimiter, (0, validation_middleware_1.validateBody)(auth_validators_1.changePasswordSchema), auth_controller_1.AuthController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map