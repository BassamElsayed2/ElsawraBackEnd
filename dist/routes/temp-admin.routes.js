"use strict";
// Temporary route لإنشاء Admin user
// ⚠️ يجب حذف هذا الملف في Production!
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
// GET /api/temp-admin/check - للتحقق من وجود admin
router.get("/check", (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email = "admin@foodcms.com" } = req.query;
    const result = await database_1.pool.request().input("email", email).query(`
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
}));
// GET /api/temp-admin/check-phone - للتحقق من رقم الهاتف
router.get("/check-phone", (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required",
        });
    }
    // Normalize phone number
    let normalizedPhone = phone.replace(/[\s\-()]/g, "");
    if (!normalizedPhone.startsWith("+")) {
        if (normalizedPhone.startsWith("20")) {
            normalizedPhone = "+" + normalizedPhone;
        }
        else if (normalizedPhone.startsWith("0")) {
            normalizedPhone = "+20" + normalizedPhone.slice(1);
        }
        else {
            normalizedPhone = "+20" + normalizedPhone;
        }
    }
    const result = await database_1.pool
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
}));
// POST /api/temp-admin/create - إنشاء حساب مدير جديد (development only)
router.post("/create", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password, full_name, phone, role = "admin", job_title = null, address = null, about = null, image_url = null, } = req.body;
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
    const normalizedPhone = (0, validation_1.normalizePhone)(phone);
    const passwordValidation = (0, validation_1.validatePassword)(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: passwordValidation.errors.join(", "),
        });
    }
    const emailCheck = await database_1.pool
        .request()
        .input("email", normalizedEmail)
        .query("SELECT id FROM users WHERE email = @email");
    if (emailCheck.recordset.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Email already registered",
        });
    }
    const phoneCheck = await database_1.pool
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
    const passwordHash = await bcryptjs_1.default.hash(password, rounds);
    const transaction = database_1.pool.transaction();
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
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
}));
exports.default = router;
//# sourceMappingURL=temp-admin.routes.js.map