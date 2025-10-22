"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.easykashConfig = void 0;
exports.validateEasyKashConfig = validateEasyKashConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.easykashConfig = {
    apiUrl: process.env.EASYKASH_API_URL,
    apiKey: process.env.EASYKASH_API_KEY,
    hmacSecret: process.env.EASYKASH_HMAC_SECRET,
    callbackUrl: process.env.EASYKASH_CALLBACK_URL,
    enabled: process.env.EASYKASH_ENABLED,
};
// Validate configuration
function validateEasyKashConfig() {
    if (!exports.easykashConfig.enabled) {
        return false;
    }
    const required = ["apiKey", "hmacSecret"];
    const missing = required.filter((key) => !exports.easykashConfig[key]);
    if (missing.length > 0) {
        console.warn(`⚠️  EasyKash configuration incomplete. Missing: ${missing.join(", ")}`);
        return false;
    }
    return true;
}
// Log configuration status on load
if (exports.easykashConfig.enabled) {
    if (validateEasyKashConfig()) {
        console.log("✅ EasyKash payment gateway configured");
    }
    else {
        console.warn("⚠️  EasyKash payment gateway enabled but not properly configured");
    }
}
else {
    console.log("ℹ️  EasyKash payment gateway disabled");
}
//# sourceMappingURL=easykash.js.map