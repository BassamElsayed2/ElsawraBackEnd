import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { pool } from "../config/database";
import { asyncHandler, ApiError } from "../middleware/error.middleware";

export class AdminController {
  // Get admin profile
  static getAdminProfile = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Not authenticated");
      }

      const result = await pool.request().input("userId", req.user.id).query(`
        SELECT 
          ap.id, ap.user_id, ap.full_name, ap.role, ap.permissions,
          ap.image_url, ap.job_title, ap.address, ap.about,
          ap.created_at as joined_at, ap.updated_at,
          u.email,
          p.phone
        FROM admin_profiles ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN profiles p ON ap.user_id = p.user_id
        WHERE ap.user_id = @userId
      `);

      if (result.recordset.length === 0) {
        throw new ApiError(404, "Admin profile not found");
      }

      res.json({
        success: true,
        data: {
          profile: result.recordset[0],
        },
      });
    }
  );

  // Update admin profile
  static updateAdminProfile = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Not authenticated");
      }

      const { full_name, phone, image_url, job_title, address, about } =
        req.body;

      // Check if admin profile exists
      const checkResult = await pool
        .request()
        .input("userId", req.user.id)
        .query("SELECT id FROM admin_profiles WHERE user_id = @userId");

      if (checkResult.recordset.length === 0) {
        throw new ApiError(404, "Admin profile not found");
      }

      const transaction = pool.transaction();
      await transaction.begin();

      try {
        // Update admin_profiles
        const adminUpdates: string[] = [];
        const adminRequest = transaction.request().input("userId", req.user.id);

        if (full_name !== undefined) {
          adminUpdates.push("full_name = @full_name");
          adminRequest.input("full_name", full_name);
        }

        if (image_url !== undefined) {
          adminUpdates.push("image_url = @image_url");
          adminRequest.input("image_url", image_url);
        }

        if (job_title !== undefined) {
          adminUpdates.push("job_title = @job_title");
          adminRequest.input("job_title", job_title);
        }

        if (address !== undefined) {
          adminUpdates.push("address = @address");
          adminRequest.input("address", address);
        }

        if (about !== undefined) {
          adminUpdates.push("about = @about");
          adminRequest.input("about", about);
        }

        if (adminUpdates.length > 0) {
          adminUpdates.push("updated_at = GETDATE()");
          await adminRequest.query(`
            UPDATE admin_profiles
            SET ${adminUpdates.join(", ")}
            WHERE user_id = @userId
          `);
        }

        // Update profiles (phone and full_name)
        const profileUpdates: string[] = [];
        const profileRequest = transaction
          .request()
          .input("userId", req.user.id);

        if (full_name !== undefined) {
          profileUpdates.push("full_name = @full_name");
          profileRequest.input("full_name", full_name);
        }

        if (phone !== undefined) {
          profileUpdates.push("phone = @phone, phone_verified = 0");
          profileRequest.input("phone", phone);
        }

        if (profileUpdates.length > 0) {
          profileUpdates.push("updated_at = GETDATE()");
          await profileRequest.query(`
            UPDATE profiles
            SET ${profileUpdates.join(", ")}
            WHERE user_id = @userId
          `);
        }

        await transaction.commit();

        // Get updated profile
        const updatedResult = await pool.request().input("userId", req.user.id)
          .query(`
          SELECT 
            ap.id, ap.user_id, ap.full_name, ap.role, ap.permissions,
            ap.image_url, ap.job_title, ap.address, ap.about,
            ap.created_at as joined_at, ap.updated_at,
            u.email,
            p.phone
          FROM admin_profiles ap
          LEFT JOIN users u ON ap.user_id = u.id
          LEFT JOIN profiles p ON ap.user_id = p.user_id
          WHERE ap.user_id = @userId
        `);

        res.json({
          success: true,
          message: "Profile updated successfully",
          data: {
            profile: updatedResult.recordset[0],
          },
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
  );

  // Get all admins (super_admin only)
  static getAllAdmins = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const result = await pool.request().query(`
        SELECT 
          ap.id, ap.user_id, ap.full_name, ap.role, ap.permissions,
          ap.image_url, ap.job_title, ap.address, ap.about,
          ap.created_at as joined_at, ap.updated_at,
          u.email,
          p.phone
        FROM admin_profiles ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN profiles p ON ap.user_id = p.user_id
        ORDER BY ap.created_at DESC
      `);

      res.json({
        success: true,
        data: {
          admins: result.recordset,
        },
      });
    }
  );

  // Get all regular users (admin only)
  static getAllUsers = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const result = await pool.request().query(`
        SELECT 
          p.id, p.user_id, p.full_name, p.phone, p.phone_verified,
          p.created_at as joined_at, p.updated_at,
          u.email, u.email_verified,
          COUNT(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN 1 END) as orders_count
        FROM profiles p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN orders o ON p.user_id = o.user_id
        WHERE p.user_id NOT IN (SELECT user_id FROM admin_profiles)
        GROUP BY p.id, p.user_id, p.full_name, p.phone, p.phone_verified,
                 p.created_at, p.updated_at, u.email, u.email_verified
        ORDER BY p.created_at DESC
      `);

      res.json({
        success: true,
        data: {
          users: result.recordset,
        },
      });
    }
  );
}
