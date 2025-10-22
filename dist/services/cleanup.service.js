"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupService = void 0;
const database_1 = require("../config/database");
class CleanupService {
    /**
     * Clean up expired pending orders
     */
    static async cleanupExpiredPendingOrders() {
        try {
            console.log("🧹 Starting cleanup of expired pending orders...");
            const result = await database_1.pool
                .request()
                .execute("sp_CleanupExpiredPendingOrders");
            const deletedCount = result.recordset[0]?.deleted_count || 0;
            console.log(`✅ Cleanup completed. Deleted ${deletedCount} expired pending orders.`);
            return {
                success: true,
                deletedCount,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error("❌ Cleanup failed:", error);
            throw error;
        }
    }
    /**
     * Get cleanup statistics
     */
    static async getCleanupStats() {
        try {
            const result = await database_1.pool.request().query(`
        SELECT 
          COUNT(*) as total_pending_orders,
          COUNT(CASE WHEN expires_at < GETDATE() THEN 1 END) as expired_count,
          COUNT(CASE WHEN expires_at > GETDATE() THEN 1 END) as active_count
        FROM pending_orders
      `);
            const stats = result.recordset[0];
            return {
                totalPendingOrders: stats.total_pending_orders,
                expiredCount: stats.expired_count,
                activeCount: stats.active_count,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error("❌ Failed to get cleanup stats:", error);
            throw error;
        }
    }
}
exports.CleanupService = CleanupService;
//# sourceMappingURL=cleanup.service.js.map