import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import path from "path";
import fs from "fs/promises";

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

      // Get file info
      const file = req.file;

      // Build full URL for the image using API_URL from environment
      const apiUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
      const imageUrl = `${apiUrl}/uploads/${file.filename}`;

      logger.info(`Image uploaded: ${file.filename}`);

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
    } catch (error) {
      logger.error("Error uploading image:", error);
      next(error);
    }
  },

  // Upload branch image
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

      // Get file info
      const file = req.file;

      // Build full URL for the image using API_URL from environment
      const apiUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
      const imageUrl = `${apiUrl}/uploads/${file.filename}`;

      logger.info(`Branch image uploaded: ${file.filename}`);

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
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: "Filename is required",
        });
        return;
      }

      const filePath = path.join(process.cwd(), "uploads", filename);

      try {
        await fs.unlink(filePath);
        logger.info(`Image deleted: ${filename}`);

        res.status(200).json({
          success: true,
          message: "Image deleted successfully",
        });
      } catch (err: any) {
        if (err.code === "ENOENT") {
          res.status(404).json({
            success: false,
            message: "Image not found",
          });
        } else {
          throw err;
        }
      }
    } catch (error) {
      logger.error("Error deleting image:", error);
      next(error);
    }
  },
};
