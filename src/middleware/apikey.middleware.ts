import { Request, Response, NextFunction, RequestHandler } from "express";
import rateLimit from "express-rate-limit";

import { logger } from "../utils/logger";
import { decryptDataApi } from "../utils/decrypt";

require('dotenv').config();

const apiKeyWindowMs = Number(process.env.API_KEY_RATE_WINDOW_MS) || 15 * 60 * 1000;
const apiKeyMax = Number(process.env.API_KEY_RATE_LIMIT_MAX) || 100;

/**
 * Rate limit for routes protected by x-api-key.
 * Keyed by IP (token in header changes with timestamp, so it cannot be the bucket key).
 */
export const apiKeyRateLimiter: RequestHandler = rateLimit({
    windowMs: apiKeyWindowMs,
    max: apiKeyMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
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
export const apiKeyRouteMiddleware: RequestHandler[] = [apiKeyRateLimiter, decryptApiKey];

/**
 * Middleware to decrypt x-api-key header if present
 * Decrypts the API key using ENCRYPTION_KEY from environment variables
 * Logs the decrypted data for debugging
 */
export function decryptApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"] as string | undefined;

    // Require x-api-key header
    if (!apiKey) {
        logger.error("❌ Missing x-api-key header:", {
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
            logger.warn("x-api-key header present but ENCRYPTION_KEY not configured");
            return next();
        }

        try {
            const decryptedData = decryptDataApi(apiKey, encryptionKey);
            console.log("decryptedData", decryptedData);
            const match = decryptedData.match(/\/\/\/([\d.]+)/);

            if (!match) {
                logger.error("❌ Invalid token format:", {
                    path: req.path,
                    method: req.method,
                });
                return res.status(401).json({ error: "Invalid token format" });
            }

            const sentTimestamp = parseFloat(match[1]);
            const currentTimestamp = Date.now() / 1000;

            if (Math.abs(currentTimestamp - sentTimestamp) > 60) {
                logger.error("❌ Token expired:", {
                    path: req.path,
                    method: req.method,
                    timeDifference: Math.abs(currentTimestamp - sentTimestamp),
                });
                return res.status(401).json({ error: "Token expired" });
            }
            // console.log(apiKey, "decryptedData", encryptionKey);


            // Attach decrypted data to request object for potential use in controllers
            (req as any).decryptedApiKey = decryptedData;
        } catch (error) {
            logger.error("❌ Failed to decrypt x-api-key:", {
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
