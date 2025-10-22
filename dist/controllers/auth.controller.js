"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("../middleware/error.middleware");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
// Sign up
AuthController.signUp = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const result = await auth_service_1.AuthService.signUp(req.body, req);
    res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: result,
    });
});
// Sign in
AuthController.signIn = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const result = await auth_service_1.AuthService.signIn(req.body, req);
    // Determine cookie name based on user role
    // Admins use dashboard_session, regular users use food_cms_session
    const isAdmin = ["admin", "super_admin", "manager"].includes(result.user.role || "");
    const cookieName = isAdmin ? "dashboard_session" : "food_cms_session";
    // Set httpOnly cookie
    res.cookie(cookieName, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({
        success: true,
        message: "Logged in successfully",
        data: {
            user: result.user,
        },
    });
});
// Sign out
AuthController.signOut = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const token = req.cookies["dashboard_session"] || req.cookies["food_cms_session"];
    if (req.user && token) {
        await auth_service_1.AuthService.signOut(req.user.id, token, req);
    }
    // Clear both cookies (in case both exist)
    res.clearCookie("food_cms_session");
    res.clearCookie("dashboard_session");
    res.json({
        success: true,
        message: "Logged out successfully",
    });
});
// Get current user (me)
AuthController.getMe = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated",
        });
    }
    const user = await auth_service_1.AuthService.getCurrentUser(req.user.id);
    res.json({
        success: true,
        data: { user },
    });
});
// Update profile
AuthController.updateProfile = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated",
        });
    }
    await auth_service_1.AuthService.updateProfile(req.user.id, req.body);
    res.json({
        success: true,
        message: "Profile updated successfully",
    });
});
// Change password
AuthController.changePassword = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated",
        });
    }
    const { old_password, new_password } = req.body;
    await auth_service_1.AuthService.changePassword(req.user.id, old_password, new_password, req);
    // Clear all cookies
    res.clearCookie("food_cms_session");
    res.json({
        success: true,
        message: "Password changed successfully. Please login again.",
    });
});
// Check if phone exists
AuthController.checkPhoneExists = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { phone } = req.body;
    const exists = await auth_service_1.AuthService.checkPhoneExists(phone);
    res.json({
        success: true,
        data: { exists },
    });
});
// Google Sign In
AuthController.googleSignIn = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({
            success: false,
            message: "Google ID token is required",
        });
    }
    const result = await auth_service_1.AuthService.googleSignIn(idToken, req);
    // Determine cookie name based on user role
    const isAdmin = ["admin", "super_admin", "manager"].includes(result.user.role || "");
    const cookieName = isAdmin ? "dashboard_session" : "food_cms_session";
    // Set httpOnly cookie
    res.cookie(cookieName, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({
        success: true,
        message: result.isNewUser
            ? "Account created successfully with Google"
            : "Logged in successfully with Google",
        data: {
            user: result.user,
            isNewUser: result.isNewUser,
        },
    });
});
//# sourceMappingURL=auth.controller.js.map