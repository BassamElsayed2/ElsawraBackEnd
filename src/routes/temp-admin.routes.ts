// Temporary route لإنشاء Admin user
// ⚠️ يجب حذف هذا الملف في Production!

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import { asyncHandler } from "../middleware/error.middleware";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { AuthRequest } from "../types";
import { normalizePhone, validatePassword } from "../utils/validation";

const router = Router();

// GET /api/temp-admin/check - للتحقق من وجود admin
router.get(
  "/check",
  asyncHandler(async (req: Request, res: Response) => {
    const { email = "admin@foodcms.com" } = req.query;

    const result = await pool.request().input("email", email as string).query(`
        SELECT 
          u.id, 
          u.email, 
          p.full_name, 
          ap.role
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN admin_profiles ap ON u.id = ap.user_id
        WHERE u.email = @email
      `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        exists: false,
        message: "Admin user not found",
      });
    }

    res.json({
      success: true,
      exists: true,
      data: result.recordset[0],
    });
  })
);

// GET /api/temp-admin/check-phone - للتحقق من رقم الهاتف
router.get(
  "/check-phone",
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Normalize phone number
    let normalizedPhone = (phone as string).replace(/[\s\-()]/g, "");
    if (!normalizedPhone.startsWith("+")) {
      if (normalizedPhone.startsWith("20")) {
        normalizedPhone = "+" + normalizedPhone;
      } else if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+20" + normalizedPhone.slice(1);
      } else {
        normalizedPhone = "+20" + normalizedPhone;
      }
    }

    const result = await pool
      .request()
      .input("phone", normalizedPhone)
      .query("SELECT user_id FROM profiles WHERE phone = @phone");

    if (result.recordset.length > 0) {
      return res.json({
        success: true,
        exists: true,
        message: "رقم الهاتف مستخدم بالفعل",
      });
    }

    res.json({
      success: true,
      exists: false,
      message: "رقم الهاتف متاح",
    });
  })
);

// POST /api/temp-admin/create - إنشاء حساب مدير جديد (development only)
router.post(
  "/create",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      email,
      password,
      full_name,
      phone,
      role = "admin",
      job_title = null,
      address = null,
      about = null,
      image_url = null,
    } = req.body as {
      email?: string;
      password?: string;
      full_name?: string;
      phone?: string;
      role?: "admin" | "super_admin" | "manager";
      job_title?: string | null;
      address?: string | null;
      about?: string | null;
      image_url?: string | null;
    };

    if (!email || !password || !full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, password, full_name and phone are required",
      });
    }

    const normalizedRole = ["admin", "super_admin", "manager"].includes(role)
      ? role
      : "admin";
    const normalizedEmail = email.toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(", "),
      });
    }

    const emailCheck = await pool
      .request()
      .input("email", normalizedEmail)
      .query("SELECT id FROM users WHERE email = @email");

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const phoneCheck = await pool
      .request()
      .input("phone", normalizedPhone)
      .query("SELECT user_id FROM profiles WHERE phone = @phone");

    if (phoneCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const passwordHash = await bcrypt.hash(password, rounds);

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const userResult = await transaction
        .request()
        .input("email", normalizedEmail)
        .input("passwordHash", passwordHash).query(`
          INSERT INTO users (email, password_hash, email_verified)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.created_at
          VALUES (@email, @passwordHash, 0)
        `);

      const user = userResult.recordset[0];

      await transaction
        .request()
        .input("userId", user.id)
        .input("fullName", full_name)
        .input("phone", normalizedPhone).query(`
          INSERT INTO profiles (user_id, full_name, phone, phone_verified)
          VALUES (@userId, @fullName, @phone, 0)
        `);

      await transaction
        .request()
        .input("userId", user.id)
        .input("fullName", full_name)
        .input("role", normalizedRole)
        .input("imageUrl", image_url)
        .input("jobTitle", job_title)
        .input("address", address)
        .input("about", about).query(`
          INSERT INTO admin_profiles (
            user_id,
            full_name,
            role,
            image_url,
            job_title,
            address,
            about
          )
          VALUES (
            @userId,
            @fullName,
            @role,
            @imageUrl,
            @jobTitle,
            @address,
            @about
          )
        `);

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name,
            phone: normalizedPhone,
            role: normalizedRole,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

export default router;
