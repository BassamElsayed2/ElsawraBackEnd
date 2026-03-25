"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploads_1 = require("../config/uploads");
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
    // Get file URL for paths under the configured uploads directory
    static getFileUrl(filePath) {
        const apiUrl = process.env.API_URL || "";
        const uploadsDir = (0, uploads_1.getUploadsDir)();
        const normalized = path_1.default.resolve(filePath);
        let rel = path_1.default.relative(uploadsDir, normalized).replace(/\\/g, "/");
        if (rel.startsWith("..")) {
            const m = normalized.replace(/\\/g, "/").match(/\/uploads\/(.+)$/i);
            rel = m ? m[1] : path_1.default.basename(normalized);
        }
        return `${apiUrl}/uploads/${rel.replace(/^\/+/, "")}`;
    }
}
exports.UploadService = UploadService;
//# sourceMappingURL=upload.service.js.map