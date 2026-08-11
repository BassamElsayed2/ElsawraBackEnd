import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sql from "mssql";
import { pool } from "../config/database";
import { ApiError } from "../middleware/error.middleware";
import { validatePassword, normalizePhone } from "../utils/validation";
import { logSecurityEvent } from "../middleware/security.middleware";
import { Request } from "express";
import { GoogleAuthService } from "./google-auth.service";
import { FacebookAuthService } from "./facebook-auth.service";
import { EmailService } from "./email.service";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12");
const PASSWORD_RESET_EXPIRES_MINUTES = parseInt(
  process.env.PASSWORD_RESET_EXPIRES_MINUTES || "60",
  10,
);

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  // Sign up new user
  static async signUp(data: SignUpData, req: Request) {
    const { email, password, full_name, phone } = data;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, passwordValidation.errors.join(", "));
    }

    // Check if email already exists
    const emailCheck = await pool
      .request()
      .input("email", email.toLowerCase())
      .query("SELECT id FROM users WHERE email = @email");

    if (emailCheck.recordset.length > 0) {
      await logSecurityEvent("SIGNUP_FAILED", req, undefined, email, {
        reason: "Email already exists",
      });
      throw new ApiError(400, "Email already registered");
    }

    // Check if phone already exists
    const normalizedPhone = normalizePhone(phone);
    const phoneCheck = await pool
      .request()
      .input("phone", normalizedPhone)
      .query("SELECT id FROM profiles WHERE phone = @phone");

    if (phoneCheck.recordset.length > 0) {
      throw new ApiError(400, "Phone number already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Start transaction
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Create user
      const userResult = await transaction
        .request()
        .input("email", email.toLowerCase())
        .input("passwordHash", passwordHash).query(`
          INSERT INTO users (email, password_hash, email_verified)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.created_at
          VALUES (@email, @passwordHash, 0)
        `);

      const user = userResult.recordset[0];

      // Create profile
      await transaction
        .request()
        .input("userId", user.id)
        .input("fullName", full_name)
        .input("phone", normalizedPhone).query(`
          INSERT INTO profiles (user_id, full_name, phone, phone_verified)
          VALUES (@userId, @fullName, @phone, 0)
        `);

      await transaction.commit();

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: "user",
          accountType: "customer",
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
        INSERT INTO sessions (user_id, token, device_name, ip_address, is_current, expires_at)
        VALUES (@userId, @token, @deviceName, @ipAddress, 1, @expiresAt)
      `);

      // Log success
      await logSecurityEvent("SIGNUP_SUCCESS", req, user.id, email);

      return {
        user: {
          id: user.id,
          email: user.email,
          full_name,
          phone: normalizedPhone,
          email_verified: false,
          phone_verified: false,
          role: "user",
          is_admin: false,
          permissions: [],
        },
        token,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Sign in user
  static async signIn(data: SignInData, req: Request) {
    const { email, password } = data;

    // Check account lockout
    const lockoutCheck = await pool
      .request()
      .input("identifier", email.toLowerCase())
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

    // Get user
    const userResult = await pool.request().input("email", email.toLowerCase())
      .query(`
        SELECT u.id, u.email, u.password_hash, u.email_verified,
               COALESCE(u.is_active, 1) as is_active,
               p.full_name, p.phone, p.phone_verified
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = @email
      `);

    if (userResult.recordset.length === 0) {
      // Record failed attempt
      await pool
        .request()
        .input("identifier", email.toLowerCase())
        .input("max_attempts", 5)
        .input("lockout_duration_minutes", 15)
        .output("is_locked", sql.Bit)
        .output("attempts_left", sql.Int)
        .output("locked_until", sql.DateTime2)
        .execute("sp_RecordFailedAttempt");

      await logSecurityEvent("LOGIN_FAILED", req, undefined, email, {
        reason: "User not found",
      });

      throw new ApiError(401, "Invalid email or password");
    }

    const user = userResult.recordset[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Record failed attempt
      await pool
        .request()
        .input("identifier", email.toLowerCase())
        .input("max_attempts", 5)
        .input("lockout_duration_minutes", 15)
        .output("is_locked", sql.Bit)
        .output("attempts_left", sql.Int)
        .output("locked_until", sql.DateTime2)
        .execute("sp_RecordFailedAttempt");

      await logSecurityEvent("LOGIN_FAILED", req, user.id, email, {
        reason: "Invalid password",
      });

      throw new ApiError(401, "Invalid email or password");
    }

    if (user.is_active === false || user.is_active === 0) {
      await logSecurityEvent("LOGIN_FAILED", req, user.id, email, {
        reason: "Account disabled",
      });
      throw new ApiError(403, "Account is disabled");
    }

    // Clear failed attempts
    await pool
      .request()
      .input("identifier", email.toLowerCase())
      .execute("sp_ClearFailedAttempts");

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: "user",
        accountType: "customer",
      },
      JWT_SECRET,
    ) as string;

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool
      .request()
      .input("userId", user.id)
      .input("token", token)
      .input("deviceName", req.get("user-agent") || "Unknown")
      .input("ipAddress", req.ip)
      .input("expiresAt", expiresAt).query(`
        INSERT INTO sessions (user_id, token, device_name, ip_address, is_current, expires_at)
        VALUES (@userId, @token, @deviceName, @ipAddress, 1, @expiresAt)
      `);

    // Log success
    await logSecurityEvent("LOGIN_SUCCESS", req, user.id, email);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        role: "user",
        is_admin: false,
        permissions: [],
      },
      token,
    };
  }

  // Sign out user
  static async signOut(userId: string, token: string, req: Request) {
    // Delete session
    await pool
      .request()
      .input("token", token)
      .query("DELETE FROM sessions WHERE token = @token");

    await logSecurityEvent("LOGOUT", req, userId);

    return { success: true };
  }

  // Get current user
  static async getCurrentUser(userId: string) {
    const result = await pool.request().input("userId", userId).query(`
        SELECT u.id, u.email, u.email_verified,
               p.full_name, p.phone, p.phone_verified, p.mfa_enabled
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = @userId
      `);

    if (result.recordset.length === 0) {
      throw new ApiError(404, "User not found");
    }

    const user = result.recordset[0];

    return {
      ...user,
      role: "user",
      is_admin: false,
      permissions: [],
    };
  }

  // Update profile
  static async updateProfile(
    userId: string,
    data: { full_name?: string; phone?: string },
  ) {
    const updates: string[] = [];
    const request = pool.request().input("userId", userId);

    if (data.full_name) {
      updates.push("full_name = @fullName");
      request.input("fullName", data.full_name);
    }

    if (data.phone) {
      const normalizedPhone = normalizePhone(data.phone);
      updates.push("phone = @phone, phone_verified = 0");
      request.input("phone", normalizedPhone);
    }

    if (updates.length === 0) {
      throw new ApiError(400, "No updates provided");
    }

    updates.push("updated_at = GETDATE()");

    await request.query(`
      UPDATE profiles
      SET ${updates.join(", ")}
      WHERE user_id = @userId
    `);

    return { success: true };
  }

  // Change password
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    req: Request,
  ) {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, passwordValidation.errors.join(", "));
    }

    // Get current password hash
    const userResult = await pool
      .request()
      .input("userId", userId)
      .query("SELECT password_hash, email FROM users WHERE id = @userId");

    if (userResult.recordset.length === 0) {
      throw new ApiError(404, "User not found");
    }

    const user = userResult.recordset[0];

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Check password history
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const historyCheck = await pool
      .request()
      .input("userId", userId)
      .input("passwordHash", newPasswordHash)
      .input("historyLimit", 5)
      .output("exists", sql.Bit)
      .execute("sp_CheckPasswordHistory");

    if (historyCheck.output.exists) {
      throw new ApiError(400, "Cannot reuse recent passwords");
    }

    // Update password
    await pool
      .request()
      .input("userId", userId)
      .input("passwordHash", newPasswordHash).query(`
        UPDATE users
        SET password_hash = @passwordHash, updated_at = GETDATE()
        WHERE id = @userId
      `);

    // Add to password history
    await pool
      .request()
      .input("userId", userId)
      .input("passwordHash", newPasswordHash)
      .input("maxHistory", 5)
      .execute("sp_AddPasswordToHistory");

    // Update profile
    await pool.request().input("userId", userId).query(`
        UPDATE profiles
        SET last_password_change = GETDATE()
        WHERE user_id = @userId
      `);

    // Invalidate all sessions except current
    await pool
      .request()
      .input("userId", userId)
      .query("DELETE FROM sessions WHERE user_id = @userId");

    await logSecurityEvent("PASSWORD_RESET_SUCCESS", req, userId, user.email);

    return { success: true };
  }

  /**
   * Request password reset email. Always returns success to avoid email enumeration.
   */
  static async forgotPassword(email: string, req: Request, lang?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const genericResponse = {
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    };

    const userResult = await pool
      .request()
      .input("email", normalizedEmail)
      .query(
        `SELECT id, email, is_active FROM users WHERE email = @email`,
      );

    if (userResult.recordset.length === 0) {
      await logSecurityEvent("PASSWORD_RESET_REQUEST", req, undefined, normalizedEmail, {
        reason: "User not found",
      });
      return genericResponse;
    }

    const user = userResult.recordset[0];

    if (user.is_active === false || user.is_active === 0) {
      await logSecurityEvent("PASSWORD_RESET_REQUEST", req, user.id, normalizedEmail, {
        reason: "Account inactive",
      });
      return genericResponse;
    }

    // Invalidate previous unused tokens for this user
    await pool.request().input("userId", user.id).query(`
      UPDATE password_reset_tokens
      SET used_at = GETDATE()
      WHERE user_id = @userId AND used_at IS NULL
    `);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000,
    );

    await pool
      .request()
      .input("userId", user.id)
      .input("tokenHash", tokenHash)
      .input("expiresAt", expiresAt).query(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (@userId, @tokenHash, @expiresAt)
      `);

    try {
      await EmailService.sendPasswordResetEmail(
        user.email,
        rawToken,
        lang || undefined,
      );
      await logSecurityEvent("PASSWORD_RESET_REQUEST", req, user.id, user.email, {
        reason: "Email sent",
      });
    } catch (error) {
      logger.error("Failed to send password reset email:", error);
      await logSecurityEvent("PASSWORD_RESET_REQUEST", req, user.id, user.email, {
        reason: "Email send failed",
      });
      throw new ApiError(
        500,
        "Failed to send password reset email. Please try again later.",
      );
    }

    return genericResponse;
  }

  static async resetPassword(token: string, newPassword: string, req: Request) {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, passwordValidation.errors.join(", "));
    }

    const tokenHash = hashResetToken(token);

    const tokenResult = await pool.request().input("tokenHash", tokenHash)
      .query(`
        SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email
        FROM password_reset_tokens t
        JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = @tokenHash
      `);

    if (tokenResult.recordset.length === 0) {
      throw new ApiError(400, "Invalid or expired reset link");
    }

    const resetToken = tokenResult.recordset[0];

    if (resetToken.used_at) {
      throw new ApiError(400, "This reset link has already been used");
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new ApiError(400, "Invalid or expired reset link");
    }

    const userId = resetToken.user_id as string;
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Check password history when procedure exists / user has history
    try {
      const historyCheck = await pool
        .request()
        .input("userId", userId)
        .input("passwordHash", newPasswordHash)
        .input("historyLimit", 5)
        .output("exists", sql.Bit)
        .execute("sp_CheckPasswordHistory");

      if (historyCheck.output.exists) {
        throw new ApiError(400, "Cannot reuse recent passwords");
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.warn("Password history check skipped:", error);
    }

    await pool
      .request()
      .input("userId", userId)
      .input("passwordHash", newPasswordHash).query(`
        UPDATE users
        SET password_hash = @passwordHash, updated_at = GETDATE()
        WHERE id = @userId
      `);

    try {
      await pool
        .request()
        .input("userId", userId)
        .input("passwordHash", newPasswordHash)
        .input("maxHistory", 5)
        .execute("sp_AddPasswordToHistory");
    } catch (error) {
      logger.warn("Add password history skipped:", error);
    }

    await pool.request().input("userId", userId).query(`
      UPDATE profiles
      SET last_password_change = GETDATE()
      WHERE user_id = @userId
    `);

    // Mark this token used and invalidate any other unused tokens
    await pool
      .request()
      .input("tokenId", resetToken.id)
      .input("userId", userId).query(`
        UPDATE password_reset_tokens
        SET used_at = GETDATE()
        WHERE id = @tokenId OR (user_id = @userId AND used_at IS NULL)
      `);

    // Force re-login
    await pool
      .request()
      .input("userId", userId)
      .query("DELETE FROM sessions WHERE user_id = @userId");

    await logSecurityEvent(
      "PASSWORD_RESET_SUCCESS",
      req,
      userId,
      resetToken.email,
    );

    return { success: true };
  }

  // Check if phone exists
  static async checkPhoneExists(phone: string): Promise<boolean> {
    const normalizedPhone = normalizePhone(phone);
    const result = await pool.request().input("phone", normalizedPhone).query(`
        SELECT id FROM profiles
        WHERE phone = @phone
      `);

    return result.recordset.length > 0;
  }

  // Google Sign In
  static async googleSignIn(idToken: string, req: Request) {
    // Verify Google token and get user info
    const googleUser = await GoogleAuthService.verifyIdToken(idToken);

    // Check if user exists
    const userResult = await pool
      .request()
      .input("email", googleUser.email.toLowerCase()).query(`
        SELECT u.id, u.email, u.email_verified,
               p.full_name, p.phone, p.phone_verified
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = @email
      `);

    let user: any;
    let isNewUser = false;

    if (userResult.recordset.length === 0) {
      // Create new user from Google account
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        // Create user without password (Google OAuth user)
        const newUserResult = await transaction
          .request()
          .input("email", googleUser.email.toLowerCase())
          .input("emailVerified", 1) // Google emails are pre-verified
          .query(`
            INSERT INTO users (email, email_verified)
            OUTPUT INSERTED.id, INSERTED.email, INSERTED.email_verified
            VALUES (@email, @emailVerified)
          `);

        user = newUserResult.recordset[0];

        // Create profile
        await transaction
          .request()
          .input("userId", user.id)
          .input("fullName", googleUser.name).query(`
            INSERT INTO profiles (user_id, full_name, phone_verified)
            VALUES (@userId, @fullName, 0)
          `);

        await transaction.commit();

        user.full_name = googleUser.name;
        user.phone = null;
        user.phone_verified = false;
        isNewUser = true;

        // Log signup
        await logSecurityEvent(
          "SIGNUP_SUCCESS",
          req,
          user.id,
          googleUser.email,
          {
            method: "google",
          },
        );
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      user = userResult.recordset[0];

      // If user exists but email wasn't verified, update it
      if (!user.email_verified) {
        await pool.request().input("userId", user.id).query(`
            UPDATE users
            SET email_verified = 1
            WHERE id = @userId
          `);
        user.email_verified = true;
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: "user",
        accountType: "customer",
      },
      JWT_SECRET,
    ) as string;

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool
      .request()
      .input("userId", user.id)
      .input("token", token)
      .input("deviceName", req.get("user-agent") || "Unknown")
      .input("ipAddress", req.ip)
      .input("expiresAt", expiresAt).query(`
        INSERT INTO sessions (user_id, token, device_name, ip_address, is_current, expires_at)
        VALUES (@userId, @token, @deviceName, @ipAddress, 1, @expiresAt)
      `);

    // Log success
    await logSecurityEvent("LOGIN_SUCCESS", req, user.id, googleUser.email, {
      method: "google",
      isNewUser,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        role: "user",
        is_admin: false,
        permissions: [],
      },
      token,
      isNewUser,
    };
  }

  // Facebook Sign In
  static async facebookSignIn(accessToken: string, req: Request) {
    // Verify Facebook token and get user info
    const facebookUser =
      await FacebookAuthService.verifyAccessToken(accessToken);

    // Check if user exists
    const userResult = await pool
      .request()
      .input("email", facebookUser.email.toLowerCase()).query(`
        SELECT u.id, u.email, u.email_verified,
               p.full_name, p.phone, p.phone_verified
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = @email
      `);

    let user: any;
    let isNewUser = false;

    if (userResult.recordset.length === 0) {
      // Create new user from Facebook account
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        // Create user without password (Facebook OAuth user)
        const newUserResult = await transaction
          .request()
          .input("email", facebookUser.email.toLowerCase())
          .input("emailVerified", 1) // Facebook emails are pre-verified
          .query(`
            INSERT INTO users (email, email_verified)
            OUTPUT INSERTED.id, INSERTED.email, INSERTED.email_verified
            VALUES (@email, @emailVerified)
          `);

        user = newUserResult.recordset[0];

        // Create profile
        await transaction
          .request()
          .input("userId", user.id)
          .input("fullName", facebookUser.name).query(`
            INSERT INTO profiles (user_id, full_name, phone_verified)
            VALUES (@userId, @fullName, 0)
          `);

        await transaction.commit();

        user.full_name = facebookUser.name;
        user.phone = null;
        user.phone_verified = false;
        isNewUser = true;

        // Log signup
        await logSecurityEvent(
          "SIGNUP_SUCCESS",
          req,
          user.id,
          facebookUser.email,
          {
            method: "facebook",
          },
        );
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      user = userResult.recordset[0];

      // If user exists but email wasn't verified, update it
      if (!user.email_verified) {
        await pool.request().input("userId", user.id).query(`
            UPDATE users
            SET email_verified = 1
            WHERE id = @userId
          `);
        user.email_verified = true;
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: "user",
        accountType: "customer",
      },
      JWT_SECRET,
    ) as string;

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool
      .request()
      .input("userId", user.id)
      .input("token", token)
      .input("deviceName", req.get("user-agent") || "Unknown")
      .input("ipAddress", req.ip)
      .input("expiresAt", expiresAt).query(`
        INSERT INTO sessions (user_id, token, device_name, ip_address, is_current, expires_at)
        VALUES (@userId, @token, @deviceName, @ipAddress, 1, @expiresAt)
      `);

    // Log success
    await logSecurityEvent("LOGIN_SUCCESS", req, user.id, facebookUser.email, {
      method: "facebook",
      isNewUser,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        role: "user",
        is_admin: false,
        permissions: [],
      },
      token,
      isNewUser,
    };
  }
}
