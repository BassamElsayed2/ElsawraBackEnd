"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalUploadService = exports.BUCKETS = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
// Base uploads directory (relative to backend root)
const UPLOADS_DIR = path_1.default.join(process.cwd(), "uploads");
// Bucket configurations (same keys as Supabase for compatibility)
exports.BUCKETS = {
    PRODUCT_IMAGES: "product-images",
    COMBO_OFFERS_MEDIA: "combooffersmedia",
    AVATARS: "avatars",
    BRANCHES: "branches",
    QR_IMAGES: "QrImages",
};
function getBaseUrl() {
    return process.env.API_URL || "http://localhost:" + (process.env.PORT || "3000");
}
/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
    await promises_1.default.mkdir(dirPath, { recursive: true });
}
class LocalUploadService {
    /**
     * Upload file to local uploads folder
     */
    static async uploadFile(file, bucket, folder) {
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1e9);
        const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
        const filename = `${timestamp}-${randomSuffix}.${ext}`;
        const relativePath = folder ? `${bucket}/${folder}/${filename}` : `${bucket}/${filename}`;
        const absolutePath = path_1.default.join(UPLOADS_DIR, relativePath);
        await ensureDir(path_1.default.dirname(absolutePath));
        await promises_1.default.writeFile(absolutePath, file.buffer);
        const url = `${getBaseUrl()}/uploads/${relativePath}`;
        logger_1.logger.info(`File uploaded locally: ${relativePath} in bucket: ${bucket}`);
        return { url, path: relativePath };
    }
    /**
     * Upload buffer to local uploads folder (e.g. QR codes)
     */
    static async uploadBuffer(buffer, filename, bucket, folder, _contentType = "image/png") {
        const relativePath = folder ? `${bucket}/${folder}/${filename}` : `${bucket}/${filename}`;
        const absolutePath = path_1.default.join(UPLOADS_DIR, relativePath);
        await ensureDir(path_1.default.dirname(absolutePath));
        await promises_1.default.writeFile(absolutePath, buffer);
        const url = `${getBaseUrl()}/uploads/${relativePath}`;
        logger_1.logger.info(`Buffer uploaded locally: ${relativePath} to bucket: ${bucket}`);
        return { url, path: relativePath };
    }
    /**
     * Delete file from local uploads folder
     */
    static async deleteFile(bucket, filePath) {
        // filePath can be "bucket/sub/filename" or "filename" (legacy)
        const relativePath = filePath.includes("/") ? filePath : `${bucket}/${filePath}`;
        const absolutePath = path_1.default.join(UPLOADS_DIR, relativePath);
        try {
            await promises_1.default.access(absolutePath);
            await promises_1.default.unlink(absolutePath);
            logger_1.logger.info(`File deleted locally: ${relativePath} from bucket: ${bucket}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (err?.code === "ENOENT") {
                logger_1.logger.warn(`File not found for delete: ${absolutePath}`);
                return;
            }
            logger_1.logger.error("Local delete error:", err);
            throw new Error(`Failed to delete file: ${message}`);
        }
    }
    /**
     * Ensure bucket directory exists (no-op for local)
     */
    static async createBucket(bucket) {
        const bucketPath = path_1.default.join(UPLOADS_DIR, bucket);
        await ensureDir(bucketPath);
        logger_1.logger.info(`Bucket directory ready: ${bucket}`);
    }
    /**
     * Check if bucket directory exists
     */
    static async bucketExists(bucket) {
        const bucketPath = path_1.default.join(UPLOADS_DIR, bucket);
        try {
            const stat = await promises_1.default.stat(bucketPath);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    }
}
exports.LocalUploadService = LocalUploadService;
//# sourceMappingURL=local-upload.service.js.map