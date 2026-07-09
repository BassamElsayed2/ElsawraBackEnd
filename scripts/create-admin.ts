/**
 * CLI script to create the first (or additional) admin user.
 *
 * Usage:
 *   npm run create-admin -- <email> <password> <full_name> <phone> [role]
 *
 * Example:
 *   npm run create-admin -- admin@foodcms.com "SecurePass1!" "Admin User" "+201012345678" super_admin
 */
import dotenv from "dotenv";
import { pool } from "../src/config/database";
import { AdminUsersService } from "../src/services/admin-users.service";
import type { AdminRole } from "../src/services/admin-users.service";

dotenv.config();

async function main(): Promise<void> {
  const [, , email, password, full_name, phone, roleArg] = process.argv;

  if (!email || !password || !full_name || !phone) {
    console.error(
      "Usage: npm run create-admin -- <email> <password> <full_name> <phone> [role]"
    );
    console.error("Roles: admin | super_admin | manager (default: admin)");
    process.exit(1);
  }

  const role = (roleArg as AdminRole | undefined) || "admin";

  if (!pool.connected) {
    await pool.connect();
  }

  const user = await AdminUsersService.createAdminUser({
    email,
    password,
    full_name,
    phone,
    role,
  });

  console.log("Admin user created successfully:");
  console.log(JSON.stringify(user, null, 2));

  await pool.close();
}

main().catch((error) => {
  console.error("Failed to create admin:", error.message || error);
  process.exit(1);
});
