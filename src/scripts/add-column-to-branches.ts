import { pool } from "../config/database";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addImageColumnToBranches() {
  try {
    logger.info("Starting to add image_url column to branches table...");

    // Connect to database
    await pool.connect();
    logger.info("Connected to database");

    // Check if column already exists
    const checkResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'branches' AND COLUMN_NAME = 'image_url'
    `);

    if (checkResult.recordset.length > 0) {
      logger.info("Column image_url already exists in branches table");
      console.log("✅ العمود image_url موجود بالفعل في جدول branches");
      process.exit(0);
    }

    // Add the column
    await pool.request().query(`
      ALTER TABLE branches
      ADD image_url NVARCHAR(500) NULL;
    `);

    logger.info("Successfully added image_url column to branches table");
    console.log("✅ تم إضافة عمود image_url إلى جدول branches بنجاح!");

    // Verify the column was added
    const verifyResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'branches' AND COLUMN_NAME = 'image_url'
    `);

    if (verifyResult.recordset.length > 0) {
      console.log("✅ تم التأكد من إضافة العمود بنجاح");
    }

    process.exit(0);
  } catch (error) {
    logger.error("Error adding image_url column:", error);
    console.error("❌ خطأ في إضافة العمود:", error);
    process.exit(1);
  }
}

// Run the script
addImageColumnToBranches();
