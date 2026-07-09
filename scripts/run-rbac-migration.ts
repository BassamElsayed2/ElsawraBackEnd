/**
 * Run RBAC migration: is_active column, roles & role_permissions tables
 * Usage: npm run migrate-rbac
 */
import dotenv from "dotenv";
import sql from "mssql";

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

const ALL_PERMISSIONS = [
  "users:read",
  "users:manage",
  "roles:read",
  "roles:manage",
  "products:read",
  "products:manage",
  "orders:read",
  "orders:manage",
  "branches:read",
  "branches:manage",
  "ads:read",
  "ads:manage",
  "feedback:read",
  "feedback:manage",
  "delivery:read",
  "delivery:manage",
  "settings:read",
  "settings:manage",
];

async function columnExists(
  pool: sql.ConnectionPool,
  table: string,
  column: string
): Promise<boolean> {
  const result = await pool.request().input("table", table).input("column", column)
    .query(`
    SELECT 1 AS found
    FROM sys.columns
    WHERE object_id = OBJECT_ID(@table) AND name = @column
  `);
  return result.recordset.length > 0;
}

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

async function seedRole(
  pool: sql.ConnectionPool,
  slug: string,
  nameAr: string,
  nameEn: string,
  description: string,
  permissions: string[]
): Promise<void> {
  const existing = await pool
    .request()
    .input("slug", slug)
    .query(`SELECT id FROM roles WHERE slug = @slug`);

  if (existing.recordset.length > 0) {
    console.log(`  Role "${slug}" already exists, skipping seed`);
    return;
  }

  const roleResult = await pool
    .request()
    .input("slug", slug)
    .input("name_ar", nameAr)
    .input("name_en", nameEn)
    .input("description", description).query(`
    INSERT INTO roles (slug, name_ar, name_en, description, is_system)
    OUTPUT INSERTED.id
    VALUES (@slug, @name_ar, @name_en, @description, 1)
  `);

  const roleId = roleResult.recordset[0].id;

  for (const permission of permissions) {
    await pool
      .request()
      .input("roleId", roleId)
      .input("permission", permission)
      .query(`
      INSERT INTO role_permissions (role_id, permission)
      VALUES (@roleId, @permission)
    `);
  }

  console.log(`  Seeded role "${slug}" with ${permissions.length} permissions`);
}

async function runMigration(): Promise<void> {
  console.log("Connecting to database...");
  const pool = await sql.connect(config);

  try {
    console.log("\n1. Adding is_active column to users...");
    if (await columnExists(pool, "users", "is_active")) {
      console.log("  Column is_active already exists");
    } else {
      await pool.request().query(`
        ALTER TABLE users ADD is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1
      `);
      console.log("  Added is_active column");
    }

    console.log("\n2. Creating roles table...");
    if (await tableExists(pool, "roles")) {
      console.log("  Table roles already exists");
    } else {
      await pool.request().query(`
        CREATE TABLE roles (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          slug NVARCHAR(50) NOT NULL UNIQUE,
          name_ar NVARCHAR(100) NOT NULL,
          name_en NVARCHAR(100) NULL,
          description NVARCHAR(500) NULL,
          is_system BIT NOT NULL DEFAULT 0,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);
      console.log("  Created roles table");
    }

    console.log("\n3. Creating role_permissions table...");
    if (await tableExists(pool, "role_permissions")) {
      console.log("  Table role_permissions already exists");
    } else {
      await pool.request().query(`
        CREATE TABLE role_permissions (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          role_id UNIQUEIDENTIFIER NOT NULL,
          permission NVARCHAR(100) NOT NULL,
          CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          CONSTRAINT UQ_role_permission UNIQUE (role_id, permission)
        )
      `);
      await pool.request().query(`
        CREATE INDEX IX_role_permissions_role_id ON role_permissions(role_id)
      `);
      console.log("  Created role_permissions table");
    }

    console.log("\n4. Seeding system roles...");
    await seedRole(
      pool,
      "super_admin",
      "مدير عام",
      "Super Admin",
      "صلاحيات كاملة على النظام",
      ALL_PERMISSIONS
    );
    await seedRole(pool, "admin", "مدير", "Admin", "مدير بصلاحيات واسعة", [
      ...ALL_PERMISSIONS.filter((p) => p !== "roles:manage"),
    ]);
    await seedRole(pool, "manager", "مشرف", "Manager", "مشرف بصلاحيات محدودة", [
      "products:read",
      "orders:read",
      "orders:manage",
      "branches:read",
      "feedback:read",
      "delivery:read",
    ]);

    console.log("\nMigration completed successfully!");
  } finally {
    await pool.close();
  }
}

runMigration().catch((error) => {
  console.error("Migration failed:", error.message || error);
  process.exit(1);
});
