"use strict";
// Temporary route لإنشاء Admin user
// ⚠️ يجب حذف هذا الملف في Production!
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
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
exports.default = router;
//# sourceMappingURL=temp-admin.routes.js.map