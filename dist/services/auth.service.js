"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const validation_1 = require("../utils/validation");
const security_middleware_1 = require("../middleware/security.middleware");
const google_auth_service_1 = require("./google-auth.service");
const facebook_auth_service_1 = require("./facebook-auth.service");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12");
class AuthService {
    // Sign up new user
    static async signUp(data, req) {
        const { email, password, full_name, phone } = data;
        // Validate password strength
        const passwordValidation = (0, validation_1.validatePassword)(password);
        if (!passwordValidation.isValid) {
            throw new error_middleware_1.ApiError(400, passwordValidation.errors.join(", "));
        }
        // Check if email already exists
        const emailCheck = await database_1.pool
            .request()
            .input("email", email.toLowerCase())
            .query("SELECT id FROM users WHERE email = @email");
        if (emailCheck.recordset.length > 0) {
            await (0, security_middleware_1.logSecurityEvent)("SIGNUP_FAILED", req, undefined, email, {
                reason: "Email already exists",
            });
            throw new error_middleware_1.ApiError(400, "Email already registered");
        }
        // Check if phone already exists
        const normalizedPhone = (0, validation_1.normalizePhone)(phone);
        const phoneCheck = await database_1.pool
            .request()
            .input("phone", normalizedPhone)
            .query("SELECT id FROM profiles WHERE phone = @phone");
        if (phoneCheck.recordset.length > 0) {
            throw new error_middleware_1.ApiError(400, "Phone number already registered");
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
        // Start transaction
        const transaction = database_1.pool.transaction();
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
            // Log success
            await (0, security_middleware_1.logSecurityEvent)("SIGNUP_SUCCESS", req, user.id, email);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name,
                    phone: normalizedPhone,
                },
            };
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // Sign in user
    static async signIn(data, req) {
        const { email, password } = data;
        // Check account lockout
        const lockoutCheck = await database_1.pool
            .request()
            .input("identifier", email.toLowerCase())
            .output("is_locked", mssql_1.default.Bit)
            .output("locked_until", mssql_1.default.DateTime2)
            .output("attempts_left", mssql_1.default.Int)
            .execute("sp_CheckAccountLockout");
        if (lockoutCheck.output.is_locked) {
            throw new error_middleware_1.ApiError(423, `Account temporarily locked. Try again after ${new Date(lockoutCheck.output.locked_until).toLocaleString()}`);
        }
        // Get user
        const userResult = await database_1.pool.request().input("email", email.toLowerCase())
            .query(`
        SELECT u.id, u.email, u.password_hash, u.email_verified,
               p.full_name, p.phone, p.phone_verified
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = @email
      `);
        if (userResult.recordset.length === 0) {
            // Record failed attempt
            await database_1.pool
                .request()
                .input("identifier", email.toLowerCase())
                .input("max_attempts", 5)
                .input("lockout_duration_minutes", 15)
                .output("is_locked", mssql_1.default.Bit)
                .output("attempts_left", mssql_1.default.Int)
                .output("locked_until", mssql_1.default.DateTime2)
                .execute("sp_RecordFailedAttempt");
            await (0, security_middleware_1.logSecurityEvent)("LOGIN_FAILED", req, undefined, email, {
                reason: "User not found",
            });
            throw new error_middleware_1.ApiError(401, "Invalid email or password");
        }
        const user = userResult.recordset[0];
        // Check if user is admin and get role
        const adminCheck = await database_1.pool
            .request()
            .input("userId", user.id)
            .query("SELECT id, role FROM admin_profiles WHERE user_id = @userId");
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            // Record failed attempt
            await database_1.pool
                .request()
                .input("identifier", email.toLowerCase())
                .input("max_attempts", 5)
                .input("lockout_duration_minutes", 15)
                .output("is_locked", mssql_1.default.Bit)
                .output("attempts_left", mssql_1.default.Int)
                .output("locked_until", mssql_1.default.DateTime2)
                .execute("sp_RecordFailedAttempt");
            await (0, security_middleware_1.logSecurityEvent)("LOGIN_FAILED", req, user.id, email, {
                reason: "Invalid password",
            });
            throw new error_middleware_1.ApiError(401, "Invalid email or password");
        }
        // Clear failed attempts
        await database_1.pool
            .request()
            .input("identifier", email.toLowerCase())
            .execute("sp_ClearFailedAttempts");
        // Determine user role
        const userRole = adminCheck.recordset.length > 0 ? adminCheck.recordset[0].role : "user";
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: userRole,
        }, JWT_SECRET);
        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await database_1.pool
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
        await (0, security_middleware_1.logSecurityEvent)("LOGIN_SUCCESS", req, user.id, email);
        return {
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                email_verified: user.email_verified,
                phone_verified: user.phone_verified,
                role: userRole,
            },
            token,
        };
    }
    // Sign out user
    static async signOut(userId, token, req) {
        // Delete session
        await database_1.pool
            .request()
            .input("token", token)
            .query("DELETE FROM sessions WHERE token = @token");
        await (0, security_middleware_1.logSecurityEvent)("LOGOUT", req, userId);
        return { success: true };
    }
    // Get current user
    static async getCurrentUser(userId) {
        const result = await database_1.pool.request().input("userId", userId).query(`
        SELECT u.id, u.email, u.email_verified,
               p.full_name, p.phone, p.phone_verified, p.mfa_enabled,
               ap.role
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN admin_profiles ap ON u.id = ap.user_id
        WHERE u.id = @userId
      `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "User not found");
        }
        const user = result.recordset[0];
        return {
            ...user,
            role: user.role || "user",
        };
    }
    // Update profile
    static async updateProfile(userId, data) {
        const updates = [];
        const request = database_1.pool.request().input("userId", userId);
        if (data.full_name) {
            updates.push("full_name = @fullName");
            request.input("fullName", data.full_name);
        }
        if (data.phone) {
            const normalizedPhone = (0, validation_1.normalizePhone)(data.phone);
            updates.push("phone = @phone, phone_verified = 0");
            request.input("phone", normalizedPhone);
        }
        if (updates.length === 0) {
            throw new error_middleware_1.ApiError(400, "No updates provided");
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
    static async changePassword(userId, oldPassword, newPassword, req) {
        // Validate new password
        const passwordValidation = (0, validation_1.validatePassword)(newPassword);
        if (!passwordValidation.isValid) {
            throw new error_middleware_1.ApiError(400, passwordValidation.errors.join(", "));
        }
        // Get current password hash
        const userResult = await database_1.pool
            .request()
            .input("userId", userId)
            .query("SELECT password_hash, email FROM users WHERE id = @userId");
        if (userResult.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "User not found");
        }
        const user = userResult.recordset[0];
        // Verify old password
        const isValid = await bcryptjs_1.default.compare(oldPassword, user.password_hash);
        if (!isValid) {
            throw new error_middleware_1.ApiError(401, "Current password is incorrect");
        }
        // Check password history
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS);
        const historyCheck = await database_1.pool
            .request()
            .input("userId", userId)
            .input("passwordHash", newPasswordHash)
            .input("historyLimit", 5)
            .output("exists", mssql_1.default.Bit)
            .execute("sp_CheckPasswordHistory");
        if (historyCheck.output.exists) {
            throw new error_middleware_1.ApiError(400, "Cannot reuse recent passwords");
        }
        // Update password
        await database_1.pool
            .request()
            .input("userId", userId)
            .input("passwordHash", newPasswordHash).query(`
        UPDATE users
        SET password_hash = @passwordHash, updated_at = GETDATE()
        WHERE id = @userId
      `);
        // Add to password history
        await database_1.pool
            .request()
            .input("userId", userId)
            .input("passwordHash", newPasswordHash)
            .input("maxHistory", 5)
            .execute("sp_AddPasswordToHistory");
        // Update profile
        await database_1.pool.request().input("userId", userId).query(`
        UPDATE profiles
        SET last_password_change = GETDATE()
        WHERE user_id = @userId
      `);
        // Invalidate all sessions except current
        await database_1.pool
            .request()
            .input("userId", userId)
            .query("DELETE FROM sessions WHERE user_id = @userId");
        await (0, security_middleware_1.logSecurityEvent)("PASSWORD_RESET_SUCCESS", req, userId, user.email);
        return { success: true };
    }
    // Check if phone exists
    static async checkPhoneExists(phone) {
        const normalizedPhone = (0, validation_1.normalizePhone)(phone);
        const result = await database_1.pool.request().input("phone", normalizedPhone).query(`
        SELECT id FROM profiles
        WHERE phone = @phone
      `);
        return result.recordset.length > 0;
    }
    // Google Sign In
    static async googleSignIn(idToken, req) {
        // Verify Google token and get user info
        const googleUser = await google_auth_service_1.GoogleAuthService.verifyIdToken(idToken);
        // Check if user exists
        const userResult = await database_1.pool
            .request()
            .input("email", googleUser.email.toLowerCase()).query(`
        SELECT u.id, u.email, u.email_verified,
               p.full_name, p.phone, p.phone_verified
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = @email
      `);
        let user;
        let isNewUser = false;
        if (userResult.recordset.length === 0) {
            // Create new user from Google account
            const transaction = database_1.pool.transaction();
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
                await (0, security_middleware_1.logSecurityEvent)("SIGNUP_SUCCESS", req, user.id, googleUser.email, {
                    method: "google",
                });
            }
            catch (error) {
                await transaction.rollback();
                throw error;
            }
        }
        else {
            user = userResult.recordset[0];
            // If user exists but email wasn't verified, update it
            if (!user.email_verified) {
                await database_1.pool.request().input("userId", user.id).query(`
            UPDATE users
            SET email_verified = 1
            WHERE id = @userId
          `);
                user.email_verified = true;
            }
        }
        // Check if user is admin
        const adminCheck = await database_1.pool
            .request()
            .input("userId", user.id)
            .query("SELECT id, role FROM admin_profiles WHERE user_id = @userId");
        const userRole = adminCheck.recordset.length > 0 ? adminCheck.recordset[0].role : "user";
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: userRole,
        }, JWT_SECRET);
        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await database_1.pool
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
        await (0, security_middleware_1.logSecurityEvent)("LOGIN_SUCCESS", req, user.id, googleUser.email, {
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
                role: userRole,
            },
            token,
            isNewUser,
        };
    }
    // Facebook Sign In
    static async facebookSignIn(accessToken, req) {
        // Verify Facebook token and get user info
        const facebookUser = await facebook_auth_service_1.FacebookAuthService.verifyAccessToken(accessToken);
        // Check if user exists
        const userResult = await database_1.pool
            .request()
            .input("email", facebookUser.email.toLowerCase()).query(`
        SELECT u.id, u.email, u.email_verified,
               p.full_name, p.phone, p.phone_verified
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = @email
      `);
        let user;
        let isNewUser = false;
        if (userResult.recordset.length === 0) {
            // Create new user from Facebook account
            const transaction = database_1.pool.transaction();
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
                await (0, security_middleware_1.logSecurityEvent)("SIGNUP_SUCCESS", req, user.id, facebookUser.email, {
                    method: "facebook",
                });
            }
            catch (error) {
                await transaction.rollback();
                throw error;
            }
        }
        else {
            user = userResult.recordset[0];
            // If user exists but email wasn't verified, update it
            if (!user.email_verified) {
                await database_1.pool.request().input("userId", user.id).query(`
            UPDATE users
            SET email_verified = 1
            WHERE id = @userId
          `);
                user.email_verified = true;
            }
        }
        // Check if user is admin
        const adminCheck = await database_1.pool
            .request()
            .input("userId", user.id)
            .query("SELECT id, role FROM admin_profiles WHERE user_id = @userId");
        const userRole = adminCheck.recordset.length > 0 ? adminCheck.recordset[0].role : "user";
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: userRole,
        }, JWT_SECRET);
        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await database_1.pool
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
        await (0, security_middleware_1.logSecurityEvent)("LOGIN_SUCCESS", req, user.id, facebookUser.email, {
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
                role: userRole,
            },
            token,
            isNewUser,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map