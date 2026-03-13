"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = void 0;
const logger_1 = require("../utils/logger");
const local_upload_service_1 = require("../services/local-upload.service");
exports.uploadController = {
    // Generic image upload
    uploadImage: async (req, res, next) => {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
                return;
            }
            // Get bucket and folder from request body
            const bucket = req.body.bucket || local_upload_service_1.BUCKETS.PRODUCT_IMAGES;
            const folder = req.body.folder;
            // Validate bucket
            const validBuckets = Object.values(local_upload_service_1.BUCKETS);
            if (!validBuckets.includes(bucket)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid bucket. Must be one of: ${validBuckets.join(", ")}`,
                });
                return;
            }
            // Ensure bucket directory exists
            await local_upload_service_1.LocalUploadService.createBucket(bucket);
            // Upload to local uploads folder
            const { url, path } = await local_upload_service_1.LocalUploadService.uploadFile(req.file, bucket, folder);
            logger_1.logger.info(`Image uploaded to uploads folder: ${path} in bucket: ${bucket}`);
            res.status(200).json({
                success: true,
                message: "Image uploaded successfully",
                data: {
                    url: url,
                    imageUrl: url,
                    path: path,
                    bucket: bucket,
                },
                imageUrl: url,
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error uploading image:", error);
            next(error);
        }
    },
    // Upload branch image (saved to uploads/branches like generic upload)
    uploadBranchImage: async (req, res, next) => {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
                return;
            }
            await local_upload_service_1.LocalUploadService.createBucket(local_upload_service_1.BUCKETS.BRANCHES);
            const { url } = await local_upload_service_1.LocalUploadService.uploadFile(req.file, local_upload_service_1.BUCKETS.BRANCHES, "branches");
            logger_1.logger.info(`Branch image uploaded: ${req.file.originalname}`);
            res.status(200).json({
                success: true,
                message: "Image uploaded successfully",
                imageUrl: url,
                file: {
                    filename: req.file.originalname,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error uploading branch image:", error);
            next(error);
        }
    },
    // Delete uploaded image
    deleteImage: async (req, res, next) => {
        try {
            const { bucket, path } = req.body;
            if (!bucket || !path) {
                res.status(400).json({
                    success: false,
                    message: "Bucket and path are required",
                });
                return;
            }
            // Validate bucket
            const validBuckets = Object.values(local_upload_service_1.BUCKETS);
            if (!validBuckets.includes(bucket)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid bucket. Must be one of: ${validBuckets.join(", ")}`,
                });
                return;
            }
            // Delete from local uploads folder
            await local_upload_service_1.LocalUploadService.deleteFile(bucket, path);
            logger_1.logger.info(`Image deleted from uploads folder: ${path} in bucket: ${bucket}`);
            res.status(200).json({
                success: true,
                message: "Image deleted successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error deleting image:", error);
            next(error);
        }
    },
};
//# sourceMappingURL=upload.controller.js.map