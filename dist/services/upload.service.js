"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const error_middleware_1 = require("../middleware/error.middleware");
class UploadService {
    // Process and optimize image
    static async processImage(filePath, options = {}) {
        try {
            const { width = 1200, height, quality = 80, format = "webp" } = options;
            const outputPath = filePath.replace(path_1.default.extname(filePath), `.${format}`);
            await (0, sharp_1.default)(filePath)
                .resize(width, height, {
                fit: "inside",
                withoutEnlargement: true,
            })
                .toFormat(format, { quality })
                .toFile(outputPath);
            // Delete original if different from output
            if (filePath !== outputPath && fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            return outputPath;
        }
        catch (error) {
            throw new error_middleware_1.ApiError(500, "Failed to process image");
        }
    }
    // Create thumbnail
    static async createThumbnail(filePath, width = 300, height = 300) {
        try {
            const thumbnailPath = filePath.replace(path_1.default.extname(filePath), `_thumb${path_1.default.extname(filePath)}`);
            await (0, sharp_1.default)(filePath)
                .resize(width, height, {
                fit: "cover",
            })
                .toFormat("webp", { quality: 70 })
                .toFile(thumbnailPath);
            return thumbnailPath;
        }
        catch (error) {
            throw new error_middleware_1.ApiError(500, "Failed to create thumbnail");
        }
    }
    // Delete file
    static deleteFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        catch (error) {
            console.error("Failed to delete file:", error);
        }
    }
    // Get file URL
    static getFileUrl(filePath) {
        const uploadsDir = process.env.UPLOAD_DIR || "./uploads";
        const apiUrl = process.env.API_URL;
        // Convert backslashes to forward slashes
        let relativePath = filePath.replace(/\\/g, "/");
        // Remove all possible uploads directory prefixes
        relativePath = relativePath
            .replace("./uploads/", "")
            .replace("./uploads", "")
            .replace("uploads/", "")
            .replace("uploads", "");
        // Remove leading slashes
        relativePath = relativePath.replace(/^\/+/, "");
        // Return URL with single /uploads/ prefix
        return `${apiUrl}/uploads/${relativePath}`;
    }
}
exports.UploadService = UploadService;
//# sourceMappingURL=upload.service.js.map