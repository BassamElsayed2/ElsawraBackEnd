"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
async function addImageColumnToBranches() {
    try {
        logger_1.logger.info("Starting to add image_url column to branches table...");
        // Connect to database
        await database_1.pool.connect();
        logger_1.logger.info("Connected to database");
        // Check if column already exists
        const checkResult = await database_1.pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'branches' AND COLUMN_NAME = 'image_url'
    `);
        if (checkResult.recordset.length > 0) {
            logger_1.logger.info("Column image_url already exists in branches table");
            console.log("✅ العمود image_url موجود بالفعل في جدول branches");
            process.exit(0);
        }
        // Add the column
        await database_1.pool.request().query(`
      ALTER TABLE branches
      ADD image_url NVARCHAR(500) NULL;
    `);
        logger_1.logger.info("Successfully added image_url column to branches table");
        console.log("✅ تم إضافة عمود image_url إلى جدول branches بنجاح!");
        // Verify the column was added
        const verifyResult = await database_1.pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'branches' AND COLUMN_NAME = 'image_url'
    `);
        if (verifyResult.recordset.length > 0) {
            console.log("✅ تم التأكد من إضافة العمود بنجاح");
        }
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error("Error adding image_url column:", error);
        console.error("❌ خطأ في إضافة العمود:", error);
        process.exit(1);
    }
}
// Run the script
addImageColumnToBranches();
//# sourceMappingURL=add-column-to-branches.js.map