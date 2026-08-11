/**
 * Run password reset tokens migration
 * Usage: npm run migrate-password-reset
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

async function main() {
  const pool = await sql.connect(config);
  const sqlPath = path.join(
    __dirname,
    "../database/migrations/003_password_reset_tokens.sql",
  );
  const sqlText = fs.readFileSync(sqlPath, "utf8");

  // mssql can run batches split by GO
  const batches = sqlText
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const batch of batches) {
    await pool.request().query(batch);
  }

  const check = await pool
    .request()
    .query(`SELECT 1 AS found FROM sys.tables WHERE name = 'password_reset_tokens'`);

  if (check.recordset.length === 0) {
    throw new Error("password_reset_tokens table was not created");
  }

  console.log("password_reset_tokens migration complete.");
  await pool.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
