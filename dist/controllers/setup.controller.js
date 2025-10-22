"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupController = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const database_1 = require("../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class SetupController {
}
exports.SetupController = SetupController;
_a = SetupController;
/**
 * Setup pending orders system (admin only)
 */
SetupController.setupPendingOrders = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    try {
        console.log("🔌 Setting up pending orders system...");
        // Test connection
        await database_1.pool.request().query("SELECT 1");
        console.log("✅ Database connected successfully");
        // Read SQL file
        const sqlFile = path_1.default.join(__dirname, "../../database/apply-pending-orders.sql");
        const sqlContent = fs_1.default.readFileSync(sqlFile, "utf8");
        console.log("📝 Executing SQL script...");
        // Split SQL content by GO statements
        const statements = sqlContent.split("GO").filter(stmt => stmt.trim());
        const results = [];
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    const result = await database_1.pool.request().query(statement);
                    results.push({
                        statement: i + 1,
                        success: true,
                        message: `Statement ${i + 1} executed successfully`
                    });
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                }
                catch (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error.message);
                    results.push({
                        statement: i + 1,
                        success: false,
                        message: error.message
                    });
                }
            }
        }
        console.log("🎉 Pending orders system applied successfully!");
        // Test the stored procedure
        console.log("🧪 Testing stored procedure...");
        const testResult = await database_1.pool.request().query(`
          SELECT COUNT(*) as table_count 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = 'pending_orders'
        `);
        const tableExists = testResult.recordset[0].table_count > 0;
        // Test the stored procedure
        const procTest = await database_1.pool.request().query(`
          SELECT COUNT(*) as proc_count 
          FROM INFORMATION_SCHEMA.ROUTINES 
          WHERE ROUTINE_NAME = 'sp_CreatePendingOrder'
        `);
        const procExists = procTest.recordset[0].proc_count > 0;
        res.json({
            success: true,
            message: "Pending orders system setup completed",
            data: {
                results,
                tableExists,
                procExists,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error setting up pending orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to setup pending orders system",
            error: error.message,
        });
    }
});
/**
 * Check system status
 */
SetupController.checkSystemStatus = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    try {
        // Check if pending_orders table exists
        const tableCheck = await database_1.pool.request().query(`
          SELECT COUNT(*) as table_count 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = 'pending_orders'
        `);
        // Check if stored procedures exist
        const procCheck = await database_1.pool.request().query(`
          SELECT ROUTINE_NAME 
          FROM INFORMATION_SCHEMA.ROUTINES 
          WHERE ROUTINE_NAME IN ('sp_CreatePendingOrder', 'sp_ConvertPendingToOrder', 'sp_CleanupExpiredPendingOrders')
        `);
        // Check if payments table has pending_order_id column
        const columnCheck = await database_1.pool.request().query(`
          SELECT COUNT(*) as column_count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'payments' AND COLUMN_NAME = 'pending_order_id'
        `);
        res.json({
            success: true,
            data: {
                pendingOrdersTable: tableCheck.recordset[0].table_count > 0,
                storedProcedures: procCheck.recordset.map(p => p.ROUTINE_NAME),
                pendingOrderIdColumn: columnCheck.recordset[0].column_count > 0,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to check system status",
            error: error.message,
        });
    }
});
//# sourceMappingURL=setup.controller.js.map