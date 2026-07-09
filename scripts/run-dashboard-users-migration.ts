/**
 * Migrate dashboard accounts to separate tables.
 * Usage: npm run migrate-dashboard-users
 */
import dotenv from "dotenv";
import sql from "mssql";
import fs from "fs";
import path from "path";

dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "elsawraDb",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    enableArithAbort: true,
  },
};

async function tableExists(
  pool: sql.ConnectionPool,
  table: string
): Promise<boolean> {
  const result = await pool
    .request()
    .input("table", table)
    .query(`SELECT 1 AS found FROM sys.tables WHERE name = @table`);
  return result.recordset.length > 0;
}

async function main(): Promise<void> {
  const pool = await sql.connect(config);
  console.log("Connected to database:", config.database);

  const migrationPath = path.join(
    __dirname,
    "../database/migrations/002_separate_dashboard_users.sql"
  );
  const sqlContent = fs.readFileSync(migrationPath, "utf8");
  const batches = sqlContent.split(/\nGO\s*\n/i).filter((b) => b.trim());

  for (const batch of batches) {
    if (batch.trim()) {
      await pool.request().query(batch);
    }
  }
  console.log("Schema migration applied.");

  const hasDashboardUsers = await tableExists(pool, "dashboard_users");
  const hasAdminProfiles = await tableExists(pool, "admin_profiles");

  if (!hasDashboardUsers) {
    throw new Error("dashboard_users table was not created");
  }

  if (hasAdminProfiles) {
    const existingCount = await pool.request().query(`
      SELECT COUNT(*) AS count FROM dashboard_users
    `);
    const alreadyMigrated = existingCount.recordset[0].count > 0;

    if (!alreadyMigrated) {
      console.log("\nMigrating admin accounts from admin_profiles...");

      await pool.request().query(`
        INSERT INTO dashboard_users (
          id, email, password_hash, email_verified, is_active,
          full_name, phone, role, image_url, job_title, address, about,
          created_at, updated_at
        )
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.email_verified,
          COALESCE(u.is_active, 1),
          ap.full_name,
          p.phone,
          ap.role,
          ap.image_url,
          ap.job_title,
          ap.address,
          ap.about,
          COALESCE(ap.created_at, u.created_at),
          COALESCE(ap.updated_at, u.updated_at)
        FROM admin_profiles ap
        INNER JOIN users u ON ap.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
      `);

      const migrated = await pool.request().query(`
        SELECT COUNT(*) AS count FROM dashboard_users
      `);
      console.log(`Migrated ${migrated.recordset[0].count} dashboard users.`);

      console.log("Migrating admin sessions...");
      await pool.request().query(`
        INSERT INTO dashboard_sessions (
          dashboard_user_id, token, device_name, ip_address,
          is_current, last_activity, expires_at, created_at
        )
        SELECT
          s.user_id,
          s.token,
          s.device_name,
          s.ip_address,
          s.is_current,
          s.last_activity,
          s.expires_at,
          s.created_at
        FROM sessions s
        WHERE s.user_id IN (SELECT id FROM dashboard_users)
          AND s.expires_at > GETDATE()
      `);

      console.log("Removing legacy admin records from customer tables...");
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        await transaction.request().query(`
          DELETE FROM sessions
          WHERE user_id IN (SELECT id FROM dashboard_users)
        `);

        await transaction.request().query(`
          DELETE FROM admin_profiles
          WHERE user_id IN (SELECT id FROM dashboard_users)
        `);

        await transaction.request().query(`
          DELETE FROM profiles
          WHERE user_id IN (SELECT id FROM dashboard_users)
        `);

        await transaction.request().query(`
          DELETE FROM users
          WHERE id IN (SELECT id FROM dashboard_users)
        `);

        await transaction.commit();
        console.log("Legacy admin records removed from users table.");
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      console.log("Dashboard users already exist — skipping data migration.");
    }
  } else {
    console.log("No admin_profiles table — fresh install, schema only.");
  }

  console.log("\nDashboard users separation migration complete.");
  await pool.close();
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  process.exit(1);
});
