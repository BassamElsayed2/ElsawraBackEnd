import { pool } from "../config/database";
import { ApiError } from "../middleware/error.middleware";

export class UserManagementService {
  static async setCustomerStatus(
    targetUserId: string,
    isActive: boolean,
    actorUserId: string
  ): Promise<{ user_id: string; is_active: boolean }> {
    if (targetUserId === actorUserId) {
      throw new ApiError(400, "Cannot change your own account status");
    }

    const userCheck = await pool
      .request()
      .input("userId", targetUserId)
      .query("SELECT id FROM users WHERE id = @userId");

    if (userCheck.recordset.length === 0) {
      throw new ApiError(404, "User not found");
    }

    await pool
      .request()
      .input("userId", targetUserId)
      .input("isActive", isActive ? 1 : 0)
      .query(`
        UPDATE users
        SET is_active = @isActive, updated_at = GETDATE()
        WHERE id = @userId
      `);

    if (!isActive) {
      await this.invalidateCustomerSessions(targetUserId);
    }

    return { user_id: targetUserId, is_active: isActive };
  }

  static async setDashboardUserStatus(
    targetAdminId: string,
    isActive: boolean,
    actorUserId: string
  ): Promise<{ user_id: string; is_active: boolean }> {
    if (targetAdminId === actorUserId) {
      throw new ApiError(400, "Cannot change your own account status");
    }

    const adminCheck = await pool
      .request()
      .input("adminId", targetAdminId)
      .query("SELECT id FROM dashboard_users WHERE id = @adminId");

    if (adminCheck.recordset.length === 0) {
      throw new ApiError(404, "Admin user not found");
    }

    await pool
      .request()
      .input("adminId", targetAdminId)
      .input("isActive", isActive ? 1 : 0)
      .query(`
        UPDATE dashboard_users
        SET is_active = @isActive, updated_at = GETDATE()
        WHERE id = @adminId
      `);

    if (!isActive) {
      await this.invalidateDashboardSessions(targetAdminId);
    }

    return { user_id: targetAdminId, is_active: isActive };
  }

  static async deleteCustomer(
    targetUserId: string,
    actorUserId: string
  ): Promise<void> {
    if (targetUserId === actorUserId) {
      throw new ApiError(400, "Cannot delete your own account");
    }

    const userCheck = await pool
      .request()
      .input("userId", targetUserId)
      .query("SELECT id FROM users WHERE id = @userId");

    if (userCheck.recordset.length === 0) {
      throw new ApiError(404, "User not found");
    }

    await this.invalidateCustomerSessions(targetUserId);

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const req = (userId: string) => transaction.request().input("userId", userId);

      await req(targetUserId).query(`
        IF OBJECT_ID('customer_feedback', 'U') IS NOT NULL
          DELETE FROM customer_feedback
          WHERE order_id IN (SELECT id FROM orders WHERE user_id = @userId)
      `);

      await req(targetUserId).query(`
        DELETE FROM payments
        WHERE user_id = @userId
           OR order_id IN (SELECT id FROM orders WHERE user_id = @userId)
      `);

      await req(targetUserId).query(`
        DELETE FROM orders WHERE user_id = @userId
      `);

      await req(targetUserId).query(`
        DELETE FROM addresses WHERE user_id = @userId
      `);

      await req(targetUserId).query(`
        DELETE FROM profiles WHERE user_id = @userId
      `);

      await req(targetUserId).query(`
        DELETE FROM sessions WHERE user_id = @userId
      `);

      await req(targetUserId).query(`
        DELETE FROM users WHERE id = @userId
      `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (
        error instanceof Error &&
        error.message.includes("REFERENCE constraint")
      ) {
        throw new ApiError(
          409,
          "Cannot delete user because related records still exist. Try disabling the account instead."
        );
      }
      throw error;
    }
  }

  static async deleteDashboardUser(
    targetAdminId: string,
    actorUserId: string
  ): Promise<void> {
    if (targetAdminId === actorUserId) {
      throw new ApiError(400, "Cannot delete your own account");
    }

    const adminCheck = await pool
      .request()
      .input("adminId", targetAdminId)
      .query("SELECT role FROM dashboard_users WHERE id = @adminId");

    if (adminCheck.recordset.length === 0) {
      throw new ApiError(404, "Admin user not found");
    }

    const role = adminCheck.recordset[0].role;

    if (role === "super_admin") {
      const superAdminCount = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM dashboard_users
        WHERE role = 'super_admin' AND COALESCE(is_active, 1) = 1
      `);

      if (superAdminCount.recordset[0].count <= 1) {
        throw new ApiError(400, "Cannot delete the last active super admin");
      }
    }

    await this.invalidateDashboardSessions(targetAdminId);

    await pool
      .request()
      .input("adminId", targetAdminId)
      .query("DELETE FROM dashboard_users WHERE id = @adminId");
  }

  static async updateAdminRole(
    targetAdminId: string,
    roleSlug: string,
    actorUserId: string
  ): Promise<void> {
    if (targetAdminId === actorUserId) {
      throw new ApiError(400, "Cannot change your own role");
    }

    const adminCheck = await pool
      .request()
      .input("adminId", targetAdminId)
      .query("SELECT role FROM dashboard_users WHERE id = @adminId");

    if (adminCheck.recordset.length === 0) {
      throw new ApiError(404, "Admin user not found");
    }

    const currentRole = adminCheck.recordset[0].role;

    if (currentRole === "super_admin" && roleSlug !== "super_admin") {
      const superAdminCount = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM dashboard_users
        WHERE role = 'super_admin' AND COALESCE(is_active, 1) = 1
      `);

      if (superAdminCount.recordset[0].count <= 1) {
        throw new ApiError(400, "Cannot demote the last super admin");
      }
    }

    await pool
      .request()
      .input("adminId", targetAdminId)
      .input("role", roleSlug)
      .query(`
        UPDATE dashboard_users
        SET role = @role, updated_at = GETDATE()
        WHERE id = @adminId
      `);
  }

  private static async invalidateCustomerSessions(userId: string): Promise<void> {
    await pool
      .request()
      .input("userId", userId)
      .query("DELETE FROM sessions WHERE user_id = @userId");
  }

  private static async invalidateDashboardSessions(
    adminId: string
  ): Promise<void> {
    await pool
      .request()
      .input("adminId", adminId)
      .query(
        "DELETE FROM dashboard_sessions WHERE dashboard_user_id = @adminId"
      );
  }
}
