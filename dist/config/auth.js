"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Auth Configuration
exports.AUTH_CONFIG = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        cookieName: "food_cms_session",
        useSecureCookies: process.env.NODE_ENV === "production",
    },
    password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
    },
    accountLockout: {
        maxAttempts: 5,
        lockoutDuration: 15, // minutes
    },
    passwordHistory: {
        count: 5, // Remember last 5 passwords
    },
};
//# sourceMappingURL=auth.js.map