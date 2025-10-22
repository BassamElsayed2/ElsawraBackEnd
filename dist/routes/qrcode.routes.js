"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const qrcode_controller_1 = require("../controllers/qrcode.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Get all QR Codes (admin only) - Must be before /:branchId route
router.get("/all", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, qrcode_controller_1.qrcodeController.getAllQRCodes);
// Generate QR Code for a branch (admin only)
router.post("/generate/:branchId", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, qrcode_controller_1.qrcodeController.generateQRCode);
// Get QR Code for a branch (public or authenticated)
router.get("/:branchId", qrcode_controller_1.qrcodeController.getQRCode);
// Delete QR Code (admin only)
router.delete("/:branchId", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, qrcode_controller_1.qrcodeController.deleteQRCode);
exports.default = router;
//# sourceMappingURL=qrcode.routes.js.map