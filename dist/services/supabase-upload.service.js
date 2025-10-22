"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUploadService = exports.BUCKETS = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// Bucket configurations
exports.BUCKETS = {
    PRODUCT_IMAGES: "product-images",
    COMBO_OFFERS_MEDIA: "combooffersmedia",
    AVATARS: "avatars",
    BRANCHES: "branches",
};
class SupabaseUploadService {
    /**
     * Upload file to Supabase Storage
     */
    static async uploadFile(file, bucket, folder) {
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomSuffix = Math.round(Math.random() * 1e9);
            const ext = file.originalname.split(".").pop();
            const filename = `${timestamp}-${randomSuffix}.${ext}`;
            // Create file path
            const filePath = folder ? `${folder}/${filename}` : filename;
            // Upload file to Supabase
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false, // Don't overwrite existing files
            });
            if (error) {
                logger_1.logger.error("Supabase upload error:", error);
                throw new Error(`Failed to upload file: ${error.message}`);
            }
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
            if (!urlData.publicUrl) {
                throw new Error("Failed to get public URL for uploaded file");
            }
            logger_1.logger.info(`File uploaded successfully: ${filePath} to bucket: ${bucket}`);
            return {
                url: urlData.publicUrl,
                path: filePath,
            };
        }
        catch (error) {
            logger_1.logger.error("Error in SupabaseUploadService.uploadFile:", error);
            throw error;
        }
    }
    /**
     * Delete file from Supabase Storage
     */
    static async deleteFile(bucket, path) {
        try {
            const { error } = await supabase.storage.from(bucket).remove([path]);
            if (error) {
                logger_1.logger.error("Supabase delete error:", error);
                throw new Error(`Failed to delete file: ${error.message}`);
            }
            logger_1.logger.info(`File deleted successfully: ${path} from bucket: ${bucket}`);
        }
        catch (error) {
            logger_1.logger.error("Error in SupabaseUploadService.deleteFile:", error);
            throw error;
        }
    }
    /**
     * Check if bucket exists
     */
    static async bucketExists(bucket) {
        try {
            const { data, error } = await supabase.storage.getBucket(bucket);
            return !error && data !== null;
        }
        catch (error) {
            logger_1.logger.error("Error checking bucket existence:", error);
            return false;
        }
    }
    /**
     * Create bucket if it doesn't exist
     */
    static async createBucket(bucket) {
        try {
            const exists = await this.bucketExists(bucket);
            if (exists) {
                logger_1.logger.info(`Bucket ${bucket} already exists`);
                return;
            }
            const { error } = await supabase.storage.createBucket(bucket, {
                public: true,
                allowedMimeTypes: [
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/gif",
                    "image/webp",
                ],
                fileSizeLimit: 5242880, // 5MB
            });
            if (error) {
                logger_1.logger.error("Error creating bucket:", error);
                throw new Error(`Failed to create bucket: ${error.message}`);
            }
            logger_1.logger.info(`Bucket ${bucket} created successfully`);
        }
        catch (error) {
            logger_1.logger.error("Error in SupabaseUploadService.createBucket:", error);
            throw error;
        }
    }
}
exports.SupabaseUploadService = SupabaseUploadService;
//# sourceMappingURL=supabase-upload.service.js.map