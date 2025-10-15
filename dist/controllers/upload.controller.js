"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = void 0;
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
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
            // Get file info
            const file = req.file;
            // Build full URL for the image using API_URL from environment
            const apiUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
            const imageUrl = `${apiUrl}/uploads/${file.filename}`;
            logger_1.logger.info(`Image uploaded: ${file.filename}`);
            res.status(200).json({
                success: true,
                message: "Image uploaded successfully",
                data: {
                    url: imageUrl,
                    imageUrl: imageUrl,
                },
                imageUrl,
                file: {
                    filename: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error uploading image:", error);
            next(error);
        }
    },
    // Upload branch image
    uploadBranchImage: async (req, res, next) => {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
                return;
            }
            // Get file info
            const file = req.file;
            // Build full URL for the image using API_URL from environment
            const apiUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
            const imageUrl = `${apiUrl}/uploads/${file.filename}`;
            logger_1.logger.info(`Branch image uploaded: ${file.filename}`);
            res.status(200).json({
                success: true,
                message: "Image uploaded successfully",
                imageUrl,
                file: {
                    filename: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
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
            const { filename } = req.params;
            if (!filename) {
                res.status(400).json({
                    success: false,
                    message: "Filename is required",
                });
                return;
            }
            const filePath = path_1.default.join(process.cwd(), "uploads", filename);
            try {
                await promises_1.default.unlink(filePath);
                logger_1.logger.info(`Image deleted: ${filename}`);
                res.status(200).json({
                    success: true,
                    message: "Image deleted successfully",
                });
            }
            catch (err) {
                if (err.code === "ENOENT") {
                    res.status(404).json({
                        success: false,
                        message: "Image not found",
                    });
                }
                else {
                    throw err;
                }
            }
        }
        catch (error) {
            logger_1.logger.error("Error deleting image:", error);
            next(error);
        }
    },
};
//# sourceMappingURL=upload.controller.js.map