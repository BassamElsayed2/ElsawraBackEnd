"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const error_middleware_1 = require("../middleware/error.middleware");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
    console.warn("Warning: GOOGLE_CLIENT_ID is not set. Google authentication will not work.");
}
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
class GoogleAuthService {
    /**
     * Verify Google ID token and extract user information
     */
    static async verifyIdToken(idToken) {
        try {
            if (!GOOGLE_CLIENT_ID) {
                throw new error_middleware_1.ApiError(500, "Google authentication is not configured");
            }
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new error_middleware_1.ApiError(401, "Invalid Google token");
            }
            // Verify email is present and verified
            if (!payload.email) {
                throw new error_middleware_1.ApiError(400, "Email not provided by Google");
            }
            if (!payload.email_verified) {
                throw new error_middleware_1.ApiError(400, "Google email is not verified");
            }
            return {
                email: payload.email,
                email_verified: payload.email_verified,
                name: payload.name || "",
                picture: payload.picture,
                sub: payload.sub,
            };
        }
        catch (error) {
            if (error instanceof error_middleware_1.ApiError) {
                throw error;
            }
            console.error("Google token verification error:", error);
            throw new error_middleware_1.ApiError(401, "Invalid Google token");
        }
    }
}
exports.GoogleAuthService = GoogleAuthService;
//# sourceMappingURL=google-auth.service.js.map