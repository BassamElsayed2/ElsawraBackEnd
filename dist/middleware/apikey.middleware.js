"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptApiKey = decryptApiKey;
const logger_1 = require("../utils/logger");
const decrypt_1 = require("../utils/decrypt");
require('dotenv').config();
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