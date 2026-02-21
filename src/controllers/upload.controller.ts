import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import {
  LocalUploadService,
  BUCKETS,
} from "../services/local-upload.service";

export const uploadController = {
  // Generic image upload
  uploadImage: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      // Get bucket and folder from request body
      const bucket = req.body.bucket || BUCKETS.PRODUCT_IMAGES;
      const folder = req.body.folder;

      // Validate bucket
      const validBuckets = Object.values(BUCKETS);
      if (!validBuckets.includes(bucket)) {
        res.status(400).json({
          success: false,
          message: `Invalid bucket. Must be one of: ${validBuckets.join(", ")}`,
        });
        return;
      }

      // Ensure bucket directory exists
      await LocalUploadService.createBucket(bucket);

      // Upload to local uploads folder
      const { url, path } = await LocalUploadService.uploadFile(
        req.file,
        bucket,
        folder
      );

      logger.info(`Image uploaded to uploads folder: ${path} in bucket: ${bucket}`);

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
    } catch (error) {
      logger.error("Error uploading image:", error);
      next(error);
    }
  },

  // Upload branch image (saved to uploads/branches like generic upload)
  uploadBranchImage: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      await LocalUploadService.createBucket(BUCKETS.BRANCHES);
      const { url } = await LocalUploadService.uploadFile(
        req.file,
        BUCKETS.BRANCHES,
        "branches"
      );

      logger.info(`Branch image uploaded: ${req.file.originalname}`);

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
    } catch (error) {
      logger.error("Error uploading branch image:", error);
      next(error);
    }
  },

  // Delete uploaded image
  deleteImage: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
      const validBuckets = Object.values(BUCKETS);
      if (!validBuckets.includes(bucket)) {
        res.status(400).json({
          success: false,
          message: `Invalid bucket. Must be one of: ${validBuckets.join(", ")}`,
        });
        return;
      }

      // Delete from local uploads folder
      await LocalUploadService.deleteFile(bucket, path);

      logger.info(`Image deleted from uploads folder: ${path} in bucket: ${bucket}`);

      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting image:", error);
      next(error);
    }
  },
};
