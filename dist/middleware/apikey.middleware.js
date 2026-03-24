"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRouteMiddleware = exports.apiKeyRateLimiter = void 0;
exports.decryptApiKey = decryptApiKey;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
const decrypt_1 = require("../utils/decrypt");
require('dotenv').config();
const apiKeyWindowMs = Number(process.env.API_KEY_RATE_WINDOW_MS) || 15 * 60 * 1000;
const apiKeyMax = Number(process.env.API_KEY_RATE_LIMIT_MAX) || 100;
/**
 * Rate limit for routes protected by x-api-key.
 * Keyed by IP (token in header changes with timestamp, so it cannot be the bucket key).
 */
exports.apiKeyRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: apiKeyWindowMs,
    max: apiKeyMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const retryAfterSec = Math.ceil(apiKeyWindowMs / 1000);
        res.status(429).json({
            success: false,
            error: "Too many requests",
            message: "Too many requests with this API key route. Please try again later.",
            retryAfter: retryAfterSec,
        });
    },
});
/**
 * Use this array on routes: `router.use(...apiKeyRouteMiddleware)`
 * Order: rate limit first, then decrypt/validate key.
 */
exports.apiKeyRouteMiddleware = [exports.apiKeyRateLimiter, decryptApiKey];
/**
 * Middleware to decrypt x-api-key header if present
 * Decrypts the API key using ENCRYPTION_KEY from environment variables
 * Logs the decrypted data for debugging
 */
function decryptApiKey(req, res, next) {
    const apiKey = req.headers["x-api-key"];
    // Require x-api-key header
    if (!apiKey) {
        logger_1.logger.error("❌ Missing x-api-key header:", {
            path: req.path,
            method: req.method,
        });
        return res.status(401).json({ error: "Missing x-api-key header", message: "Missing x-api-key header" });
    }
    // If x-api-key is present, decrypt it
    if (apiKey) {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        console.log("encryptionKey", encryptionKey);
        if (!encryptionKey) {
            logger_1.logger.warn("x-api-key header present but ENCRYPTION_KEY not configured");
            return next();
        }
        try {
            const decryptedData = (0, decrypt_1.decryptDataApi)(apiKey, encryptionKey);
            console.log("decryptedData", decryptedData);
            const match = decryptedData.match(/\/\/\/([\d.]+)/);
            if (!match) {
                logger_1.logger.error("❌ Invalid token format:", {
                    path: req.path,
                    method: req.method,
                });
                return res.status(401).json({ error: "Invalid token format" });
            }
            const sentTimestamp = parseFloat(match[1]);
            const currentTimestamp = Date.now() / 1000;
            if (Math.abs(currentTimestamp - sentTimestamp) > 60) {
                logger_1.logger.error("❌ Token expired:", {
                    path: req.path,
                    method: req.method,
                    timeDifference: Math.abs(currentTimestamp - sentTimestamp),
                });
                return res.status(401).json({ error: "Token expired" });
            }
            // console.log(apiKey, "decryptedData", encryptionKey);
            // Attach decrypted data to request object for potential use in controllers
            req.decryptedApiKey = decryptedData;
        }
        catch (error) {
            logger_1.logger.error("❌ Failed to decrypt x-api-key:", {
                error: error instanceof Error ? error.message : String(error),
                path: req.path,
                method: req.method,
            });
            return res.status(401).json({
                error: "Failed to decrypt or validate API key",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    next();
}
//# sourceMappingURL=apikey.middleware.js.map