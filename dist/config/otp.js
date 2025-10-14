"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP_CONFIG = void 0;
exports.generateOTP = generateOTP;
exports.sendOTPviaSMS = sendOTPviaSMS;
exports.verifyOTPviaSMS = verifyOTPviaSMS;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// OTP Configuration - DISABLED FOR NOW
// Will be enabled when Twilio credentials are configured
exports.OTP_CONFIG = {
    enabled: false, // Set to true when ready to use OTP
    length: 6,
    expiryMinutes: 10,
    maxAttempts: 3,
    resendCooldown: 60, // seconds
};
// Placeholder functions - will be implemented when OTP is enabled
function generateOTP(length = 6) {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}
// Mock function - returns success for development
async function sendOTPviaSMS(phone, code) {
    if (!exports.OTP_CONFIG.enabled) {
        console.log(`[OTP DISABLED] Would send OTP ${code} to ${phone}`);
        return {
            success: true,
            messageId: "mock-message-id",
        };
    }
    // When enabled, implement Twilio integration here
    return {
        success: false,
        error: "OTP service not configured",
    };
}
// Mock function - returns success for development
async function verifyOTPviaSMS(phone, code) {
    if (!exports.OTP_CONFIG.enabled) {
        console.log(`[OTP DISABLED] Would verify OTP ${code} for ${phone}`);
        return { success: true };
    }
    // When enabled, implement Twilio verification here
    return {
        success: false,
        error: "OTP service not configured",
    };
}
//# sourceMappingURL=otp.js.map