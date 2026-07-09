import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import { ApiError } from "../middleware/error.middleware";
import { normalizePhone, validatePassword } from "../utils/validation";
import { RolesService } from "./roles.service";

export type AdminRole = string;

export interface CreateAdminUserInput {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role?: AdminRole;
  job_title?: string | null;
  address?: string | null;
  about?: string | null;
  image_url?: string | null;
}

export interface CreatedAdminUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: AdminRole;
}

export class AdminUsersService {
  static async checkPhoneAvailable(phone: string): Promise<{
    exists: boolean;
    message: string;
  }> {
    const normalizedPhone = normalizePhone(phone);

    const result = await pool
      .request()
      .input("phone", normalizedPhone)
      .query("SELECT id FROM dashboard_users WHERE phone = @phone");

    if (result.recordset.length > 0) {
      return {
        exists: true,
        message: "رقم الهاتف مستخدم بالفعل",
      };
    }

    return {
      exists: false,
      message: "رقم الهاتف متاح",
    };
  }

  static async createAdminUser(
    input: CreateAdminUserInput
  ): Promise<CreatedAdminUser> {
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
    } = input;

    if (!email || !password || !full_name || !phone) {
      throw new ApiError(
        400,
        "Email, password, full_name and phone are required"
      );
    }

    const roleSlug = role || "admin";
    if (!(await RolesService.roleSlugExists(roleSlug))) {
      throw new ApiError(400, "Invalid role");
    }
    const finalRole = roleSlug;
    const normalizedEmail = email.toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, passwordValidation.errors.join(", "));
    }

    const emailCheck = await pool
      .request()
      .input("email", normalizedEmail)
      .query("SELECT id FROM dashboard_users WHERE email = @email");

    if (emailCheck.recordset.length > 0) {
      throw new ApiError(400, "Email already registered");
    }

    const phoneCheck = await pool
      .request()
      .input("phone", normalizedPhone)
      .query("SELECT id FROM dashboard_users WHERE phone = @phone");

    if (phoneCheck.recordset.length > 0) {
      throw new ApiError(400, "Phone number already registered");
    }

    const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const passwordHash = await bcrypt.hash(password, rounds);

    const result = await pool
      .request()
      .input("email", normalizedEmail)
      .input("passwordHash", passwordHash)
      .input("fullName", full_name)
      .input("phone", normalizedPhone)
      .input("role", finalRole)
      .input("imageUrl", image_url)
      .input("jobTitle", job_title)
      .input("address", address)
      .input("about", about).query(`
        INSERT INTO dashboard_users (
          email, password_hash, email_verified, full_name, phone, role,
          image_url, job_title, address, about
        )
        OUTPUT INSERTED.id, INSERTED.email
        VALUES (
          @email, @passwordHash, 0, @fullName, @phone, @role,
          @imageUrl, @jobTitle, @address, @about
        )
      `);

    const user = result.recordset[0];

    return {
      id: user.id,
      email: user.email,
      full_name,
      phone: normalizedPhone,
      role: finalRole,
    };
  }
}
