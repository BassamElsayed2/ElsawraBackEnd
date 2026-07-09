import { pool } from "../config/database";
import { ApiError } from "../middleware/error.middleware";
import {
  ALL_PERMISSION_KEYS,
  isValidPermission,
} from "../constants/permissions";

export interface Role {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  is_system: boolean;
  permissions: string[];
  admins_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoleInput {
  slug?: string;
  name_ar: string;
  name_en?: string | null;
  description?: string | null;
  permissions: string[];
}

export interface UpdateRoleInput {
  name_ar?: string;
  name_en?: string | null;
  description?: string | null;
  permissions?: string[];
}

function normalizeSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

async function resolveUniqueSlug(
  nameAr: string,
  providedSlug?: string
): Promise<string> {
  let base = providedSlug ? normalizeSlug(providedSlug) : normalizeSlug(nameAr);
  if (!base || base.length < 2) {
    base = `role_${Date.now().toString(36)}`;
  }

  let candidate = base;
  let suffix = 0;
  while (true) {
    const existing = await pool
      .request()
      .input("slug", candidate)
      .query("SELECT id FROM roles WHERE slug = @slug");
    if (existing.recordset.length === 0) break;
    suffix += 1;
    candidate = `${base}_${suffix}`;
  }
  return candidate;
}

function validatePermissions(permissions: string[]): string[] {
  const unique = [...new Set(permissions)];
  const invalid = unique.filter((p) => !isValidPermission(p));
  if (invalid.length > 0) {
    throw new ApiError(400, `Invalid permissions: ${invalid.join(", ")}`);
  }
  return unique;
}

async function attachPermissions(
  roles: Omit<Role, "permissions">[]
): Promise<Role[]> {
  if (roles.length === 0) return [];

  const roleIds = roles.map((r) => r.id);
  const placeholders = roleIds.map((_, i) => `@roleId${i}`).join(", ");
  const request = pool.request();
  roleIds.forEach((id, i) => request.input(`roleId${i}`, id));

  const permResult = await request.query(`
    SELECT role_id, permission
    FROM role_permissions
    WHERE role_id IN (${placeholders})
    ORDER BY permission
  `);

  const permMap = new Map<string, string[]>();
  for (const row of permResult.recordset) {
    const list = permMap.get(row.role_id) || [];
    list.push(row.permission);
    permMap.set(row.role_id, list);
  }

  return roles.map((role) => ({
    ...role,
    permissions: permMap.get(role.id) || [],
  }));
}

export class RolesService {
  static async getAllRoles(): Promise<Role[]> {
    const result = await pool.request().query(`
      SELECT
        r.id, r.slug, r.name_ar, r.name_en, r.description, r.is_system,
        r.created_at, r.updated_at,
        (SELECT COUNT(*) FROM dashboard_users du WHERE du.role = r.slug) AS admins_count
      FROM roles r
      ORDER BY r.is_system DESC, r.name_ar ASC
    `);
    return attachPermissions(result.recordset);
  }

  static async getRoleBySlug(slug: string): Promise<Role | null> {
    const result = await pool
      .request()
      .input("slug", slug)
      .query(`
        SELECT id, slug, name_ar, name_en, description, is_system, created_at, updated_at
        FROM roles
        WHERE slug = @slug
      `);

    if (result.recordset.length === 0) return null;
    const [role] = await attachPermissions(result.recordset);
    return role;
  }

  static async getRoleById(id: string): Promise<Role | null> {
    const result = await pool.request().input("id", id).query(`
      SELECT id, slug, name_ar, name_en, description, is_system, created_at, updated_at
      FROM roles
      WHERE id = @id
    `);

    if (result.recordset.length === 0) return null;
    const [role] = await attachPermissions(result.recordset);
    return role;
  }

  static async getPermissionsForAdminRole(roleSlug: string): Promise<string[]> {
    if (roleSlug === "super_admin") {
      return ALL_PERMISSION_KEYS;
    }

    const role = await this.getRoleBySlug(roleSlug);
    return role?.permissions || [];
  }

  static async createRole(input: CreateRoleInput): Promise<Role> {
    if (!input.name_ar?.trim()) {
      throw new ApiError(400, "Arabic name is required");
    }

    const slug = await resolveUniqueSlug(input.name_ar, input.slug);
    const permissions = validatePermissions(input.permissions || []);

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const roleResult = await transaction
        .request()
        .input("slug", slug)
        .input("name_ar", input.name_ar.trim())
        .input("name_en", input.name_en?.trim() || null)
        .input("description", input.description?.trim() || null).query(`
          INSERT INTO roles (slug, name_ar, name_en, description, is_system)
          OUTPUT INSERTED.id, INSERTED.slug, INSERTED.name_ar, INSERTED.name_en,
                 INSERTED.description, INSERTED.is_system, INSERTED.created_at, INSERTED.updated_at
          VALUES (@slug, @name_ar, @name_en, @description, 0)
        `);

      const role = roleResult.recordset[0];

      for (const permission of permissions) {
        await transaction
          .request()
          .input("roleId", role.id)
          .input("permission", permission)
          .query(`
            INSERT INTO role_permissions (role_id, permission)
            VALUES (@roleId, @permission)
          `);
      }

      await transaction.commit();
      return { ...role, permissions };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    const existing = await this.getRoleById(id);
    if (!existing) {
      throw new ApiError(404, "Role not found");
    }

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const updates: string[] = [];
      const request = transaction.request().input("id", id);

      if (input.name_ar !== undefined) {
        if (!input.name_ar.trim()) {
          throw new ApiError(400, "Arabic name cannot be empty");
        }
        updates.push("name_ar = @name_ar");
        request.input("name_ar", input.name_ar.trim());
      }

      if (input.name_en !== undefined) {
        updates.push("name_en = @name_en");
        request.input("name_en", input.name_en?.trim() || null);
      }

      if (input.description !== undefined) {
        updates.push("description = @description");
        request.input("description", input.description?.trim() || null);
      }

      if (updates.length > 0) {
        updates.push("updated_at = GETDATE()");
        await request.query(`
          UPDATE roles SET ${updates.join(", ")} WHERE id = @id
        `);
      }

      if (input.permissions !== undefined) {
        const permissions = validatePermissions(input.permissions);
        await transaction
          .request()
          .input("roleId", id)
          .query("DELETE FROM role_permissions WHERE role_id = @roleId");

        for (const permission of permissions) {
          await transaction
            .request()
            .input("roleId", id)
            .input("permission", permission)
            .query(`
              INSERT INTO role_permissions (role_id, permission)
              VALUES (@roleId, @permission)
            `);
        }
      }

      await transaction.commit();
      const updated = await this.getRoleById(id);
      if (!updated) throw new ApiError(404, "Role not found");
      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async deleteRole(id: string, actorRole?: string): Promise<void> {
    const existing = await this.getRoleById(id);
    if (!existing) {
      throw new ApiError(404, "Role not found");
    }

    if (existing.slug === "super_admin") {
      throw new ApiError(400, "Cannot delete super admin role");
    }

    if (existing.is_system && actorRole !== "super_admin") {
      throw new ApiError(400, "Only super admin can delete system roles");
    }

    const adminsUsingRole = await pool
      .request()
      .input("slug", existing.slug)
      .query(`
        SELECT COUNT(*) as count FROM dashboard_users WHERE role = @slug
      `);

    if (adminsUsingRole.recordset[0].count > 0) {
      throw new ApiError(
        400,
        "Cannot delete role assigned to admin users. Reassign users first."
      );
    }

    await pool
      .request()
      .input("id", id)
      .query("DELETE FROM role_permissions WHERE role_id = @id");

    await pool.request().input("id", id).query("DELETE FROM roles WHERE id = @id");
  }

  static async roleSlugExists(slug: string): Promise<boolean> {
    const result = await pool
      .request()
      .input("slug", slug)
      .query("SELECT id FROM roles WHERE slug = @slug");
    return result.recordset.length > 0;
  }
}
