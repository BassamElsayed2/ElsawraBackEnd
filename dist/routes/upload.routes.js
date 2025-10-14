"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Generic image upload (admin only)
router.post("/image", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, upload_middleware_1.uploadSingle)("image"), upload_controller_1.uploadController.uploadImage);
// Upload branch image (admin only)
router.post("/branch-image", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, upload_middleware_1.uploadSingle)("image"), upload_controller_1.uploadController.uploadBranchImage);
// Delete image (admin only)
router.delete("/image/:filename", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, upload_controller_1.uploadController.deleteImage);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map