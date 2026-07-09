import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sql from "mssql";
import { pool } from "../config/database";
import { ApiError } from "../middleware/error.middleware";
import { validatePassword, normalizePhone } from "../utils/validation";
import { logSecurityEvent } from "../middleware/security.middleware";
import { Request } from "express";
import { RolesService } from "./roles.service";

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12");

interface SignInData {
  email: string;
  password: string;
}

function dashboardLockoutId(email: string): string {
  return `dashboard:${email.toLowerCase()}`;
}

export class DashboardAuthService {
  static async signIn(data: SignInData, req: Request) {
    const { email, password } = data;
    const lockoutId = dashboardLockoutId(email);

    const lockoutCheck = await pool
      .request()
      .input("identifier", lockoutId)
      .output("is_locked", sql.Bit)
      .output("locked_until", sql.DateTime2)
      .output("attempts_left", sql.Int)
      .execute("sp_CheckAccountLockout");

    if (lockoutCheck.output.is_locked) {
      throw new ApiError(
        423,
        `Account temporarily locked. Try again after ${new Date(
          lockoutCheck.output.locked_until,
        ).toLocaleString()}`,
      );
    }

    const userResult = await pool.request().input("email", email.toLowerCase())
      .query(`
        SELECT id, email, password_hash, email_verified,
               COALESCE(is_active, 1) as is_active,
               full_name, phone, role
        FROM dashboard_users
        WHERE email = @email
      `);

    if (userResult.recordset.length === 0) {
      await pool
        .request()
        .input("identifier", lockoutId)
        .input("max_attempts", 5)
        .input("lockout_duration_minutes", 15)
        .output("is_locked", sql.Bit)
        .output("attempts_left", sql.Int)
        .output("locked_until", sql.DateTime2)
        .execute("sp_RecordFailedAttempt");

      await logSecurityEvent("LOGIN_FAILED", req, undefined, email, {
        reason: "Dashboard user not found",
        accountType: "dashboard",
      });

      throw new ApiError(401, "Invalid email or password");
    }

    const user = userResult.recordset[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await pool
        .request()
        .input("identifier", lockoutId)
        .input("max_attempts", 5)
        .input("lockout_duration_minutes", 15)
        .output("is_locked", sql.Bit)
        .output("attempts_left", sql.Int)
        .output("locked_until", sql.DateTime2)
        .execute("sp_RecordFailedAttempt");

      await logSecurityEvent("LOGIN_FAILED", req, user.id, email, {
        reason: "Invalid password",
        accountType: "dashboard",
      });

      throw new ApiError(401, "Invalid email or password");
    }

    if (user.is_active === false || user.is_active === 0) {
      throw new ApiError(403, "Account is disabled");
    }

    await pool
      .request()
      .input("identifier", lockoutId)
      .execute("sp_ClearFailedAttempts");

    const permissions = await RolesService.getPermissionsForAdminRole(
      user.role,
    );

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        accountType: "dashboard",
      },
      JWT_SECRET,
    ) as string;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool
      .request()
      .input("userId", user.id)
      .input("token", token)
      .input("deviceName", req.get("user-agent") || "Unknown")
      .input("ipAddress", req.ip)
      .input("expiresAt", expiresAt).query(`
        INSERT INTO dashboard_sessions (
          dashboard_user_id, token, device_name, ip_address, is_current, expires_at
        )
        VALUES (@userId, @token, @deviceName, @ipAddress, 1, @expiresAt)
      `);

    await logSecurityEvent("LOGIN_SUCCESS", req, user.id, email, {
      accountType: "dashboard",
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        email_verified: user.email_verified,
        role: user.role,
        is_admin: true,
        permissions,
      },
      token,
    };
  }

  static async signOut(userId: string, token: string, req: Request) {
    await pool
      .request()
      .input("token", token)
      .query("DELETE FROM dashboard_sessions WHERE token = @token");

    await logSecurityEvent("LOGOUT", req, userId, undefined, {
      accountType: "dashboard",
    });

    return { success: true };
  }

  static async getCurrentUser(userId: string) {
    const result = await pool.request().input("userId", userId).query(`
      SELECT id, email, email_verified, full_name, phone, role,
             image_url, job_title, address, about
      FROM dashboard_users
      WHERE id = @userId
    `);

    if (result.recordset.length === 0) {
      throw new ApiError(404, "Dashboard user not found");
    }

    const user = result.recordset[0];
    const permissions = await RolesService.getPermissionsForAdminRole(
      user.role,
    );

    return {
      ...user,
      is_admin: true,
      permissions,
    };
  }

  static async updateProfile(
    userId: string,
    data: {
      full_name?: string;
      phone?: string;
      image_url?: string;
      job_title?: string;
      address?: string;
      about?: string;
    },
  ) {
    const updates: string[] = [];
    const request = pool.request().input("userId", userId);

    if (data.full_name !== undefined) {
      updates.push("full_name = @fullName");
      request.input("fullName", data.full_name);
    }

    if (data.phone !== undefined) {
      updates.push("phone = @phone");
      request.input("phone", normalizePhone(data.phone));
    }

    if (data.image_url !== undefined) {
      updates.push("image_url = @imageUrl");
      request.input("imageUrl", data.image_url);
    }

    if (data.job_title !== undefined) {
      updates.push("job_title = @jobTitle");
      request.input("jobTitle", data.job_title);
    }

    if (data.address !== undefined) {
      updates.push("address = @address");
      request.input("address", data.address);
    }

    if (data.about !== undefined) {
      updates.push("about = @about");
      request.input("about", data.about);
    }

    if (updates.length === 0) {
      throw new ApiError(400, "No updates provided");
    }

    updates.push("updated_at = GETDATE()");

    await request.query(`
      UPDATE dashboard_users
      SET ${updates.join(", ")}
      WHERE id = @userId
    `);

    return { success: true };
  }

  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    req: Request,
  ) {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, passwordValidation.errors.join(", "));
    }

    const userResult = await pool
      .request()
      .input("userId", userId)
      .query(
        "SELECT password_hash, email FROM dashboard_users WHERE id = @userId",
      );

    if (userResult.recordset.length === 0) {
      throw new ApiError(404, "Dashboard user not found");
    }

    const user = userResult.recordset[0];
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await pool
      .request()
      .input("userId", userId)
      .input("passwordHash", newPasswordHash).query(`
        UPDATE dashboard_users
        SET password_hash = @passwordHash, updated_at = GETDATE()
        WHERE id = @userId
      `);

    await pool
      .request()
      .input("userId", userId)
      .query(
        "DELETE FROM dashboard_sessions WHERE dashboard_user_id = @userId",
      );

    await logSecurityEvent("PASSWORD_RESET_SUCCESS", req, userId, user.email, {
      accountType: "dashboard",
    });

    return { success: true };
  }
}
