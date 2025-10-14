import { Request, Response, NextFunction } from "express";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

export class DeliveryController {
  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get nearest branch
  static async getNearestBranch(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required",
        });
      }

      // Get all branches
      const result = await pool.request().query(`
        SELECT 
          id,
          name,
          name_en,
          latitude,
          longitude,
          delivery_fee_per_km,
          max_delivery_distance
        FROM branches
        WHERE is_active = 1
      `);

      const branches = result.recordset;

      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active branches found",
        });
      }

      // Find nearest branch
      let nearestBranch = null;
      let minDistance = Infinity;

      for (const branch of branches) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          branch.latitude,
          branch.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestBranch = {
            ...branch,
            distance: Math.round(distance * 100) / 100,
          };
        }
      }

      res.status(200).json({
        success: true,
        data: nearestBranch,
      });
    } catch (error) {
      logger.error("Error getting nearest branch:", error);
      next(error);
    }
  }

  // Calculate delivery fee
  static async calculateDeliveryFee(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required",
        });
      }

      // Get all branches
      const result = await pool.request().query(`
        SELECT 
          id,
          name,
          name_en,
          latitude,
          longitude,
          delivery_fee_per_km,
          max_delivery_distance
        FROM branches
        WHERE is_active = 1
      `);

      const branches = result.recordset;

      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active branches found",
        });
      }

      // Find nearest branch
      let nearestBranch = null;
      let minDistance = Infinity;

      for (const branch of branches) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          branch.latitude,
          branch.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestBranch = branch;
        }
      }

      if (!nearestBranch) {
        return res.status(404).json({
          success: false,
          message: "No branch found",
        });
      }

      const distance = minDistance;

      // Check if within delivery range
      if (distance > nearestBranch.max_delivery_distance) {
        return res.status(200).json({
          success: true,
          data: {
            fee: 0,
            distance: Math.round(distance * 100) / 100,
            available: false,
            message: "Outside delivery area",
            branch: {
              id: nearestBranch.id,
              name: nearestBranch.name,
              name_en: nearestBranch.name_en,
            },
          },
        });
      }

      const fee =
        Math.round(distance * nearestBranch.delivery_fee_per_km * 100) / 100;

      res.status(200).json({
        success: true,
        data: {
          fee,
          distance: Math.round(distance * 100) / 100,
          available: true,
          branch: {
            id: nearestBranch.id,
            name: nearestBranch.name,
            name_en: nearestBranch.name_en,
            latitude: nearestBranch.latitude,
            longitude: nearestBranch.longitude,
          },
        },
      });
    } catch (error) {
      logger.error("Error calculating delivery fee:", error);
      next(error);
    }
  }
}
