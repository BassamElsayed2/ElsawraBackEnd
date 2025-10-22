"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookAuthService = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.warn("Warning: FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is not set. Facebook authentication will not work.");
}
class FacebookAuthService {
    /**
     * Verify Facebook access token and get user information
     */
    static async verifyAccessToken(accessToken) {
        try {
            if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
                throw new error_middleware_1.ApiError(500, "Facebook authentication is not configured");
            }
            // Verify that the access token belongs to our app
            const appTokenResponse = await fetch(`https://graph.facebook.com/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&grant_type=client_credentials`);
            if (!appTokenResponse.ok) {
                throw new error_middleware_1.ApiError(401, "Failed to verify Facebook token");
            }
            const appTokenData = (await appTokenResponse.json());
            const appAccessToken = appTokenData.access_token;
            // Inspect the user access token to verify it's valid and belongs to our app
            const inspectResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`);
            if (!inspectResponse.ok) {
                throw new error_middleware_1.ApiError(401, "Invalid Facebook access token");
            }
            const inspectData = (await inspectResponse.json());
            if (!inspectData.data || !inspectData.data.is_valid) {
                throw new error_middleware_1.ApiError(401, "Invalid Facebook access token");
            }
            if (inspectData.data.app_id !== FACEBOOK_APP_ID) {
                throw new error_middleware_1.ApiError(401, "Access token does not belong to this app");
            }
            // Get user information from Facebook Graph API
            const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
            if (!userResponse.ok) {
                throw new error_middleware_1.ApiError(401, "Failed to fetch user information from Facebook");
            }
            const userData = (await userResponse.json());
            // Verify email is present
            if (!userData.email) {
                throw new error_middleware_1.ApiError(400, "Email permission not granted. Please allow email access to continue.");
            }
            return {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
            };
        }
        catch (error) {
            if (error instanceof error_middleware_1.ApiError) {
                throw error;
            }
            console.error("Facebook token verification error:", error);
            throw new error_middleware_1.ApiError(401, "Invalid Facebook access token");
        }
    }
}
exports.FacebookAuthService = FacebookAuthService;
//# sourceMappingURL=facebook-auth.service.js.map