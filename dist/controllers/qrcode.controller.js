"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrcodeController = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const mssql_1 = __importDefault(require("mssql"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
exports.qrcodeController = {
    // Generate QR Code for a branch
    generateQRCode: async (req, res, next) => {
        try {
            const { branchId } = req.params;
            if (!branchId) {
                res.status(400).json({
                    success: false,
                    message: "Branch ID is required",
                });
                return;
            }
            // Check if branch exists
            const branchCheck = await database_1.pool
                .request()
                .input("branchId", mssql_1.default.UniqueIdentifier, branchId)
                .query("SELECT id, name_ar, name_en FROM branches WHERE id = @branchId");
            if (branchCheck.recordset.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Branch not found",
                });
                return;
            }
            const branch = branchCheck.recordset[0];
            // Check if QR code already exists for this branch
            const existingQR = await database_1.pool
                .request()
                .input("branchId", mssql_1.default.UniqueIdentifier, branchId)
                .query("SELECT * FROM branch_qrcodes WHERE branch_id = @branchId AND is_active = 1");
            if (existingQR.recordset.length > 0) {
                // Return existing QR code
                const qrCode = existingQR.recordset[0];
                const protocol = req.protocol;
                const host = req.get("host");
                res.json({
                    success: true,
                    message: "QR Code already exists",
                    qrCode: {
                        id: qrCode.id,
                        branch_id: qrCode.branch_id,
                        qr_code_url: `${protocol}://${host}/uploads/qrcodes/${qrCode.qr_code_filename}`,
                        survey_url: qrCode.survey_url,
                        created_at: qrCode.created_at,
                    },
                });
                return;
            }
            // Generate survey URL
            const DashboardUrl = process.env.DASHBOARD_URL;
            const surveyUrl = `${DashboardUrl}/feedback-survey/${branchId}`;
            // Ensure QR codes directory exists
            const qrCodesDir = path_1.default.join(process.cwd(), "uploads", "qrcodes");
            try {
                await promises_1.default.access(qrCodesDir);
            }
            catch {
                await promises_1.default.mkdir(qrCodesDir, { recursive: true });
            }
            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1e9);
            const filename = `qr-${branchId}-${timestamp}-${random}.png`;
            const filePath = path_1.default.join(qrCodesDir, filename);
            // Generate QR Code
            await qrcode_1.default.toFile(filePath, surveyUrl, {
                errorCorrectionLevel: "H",
                type: "png",
                margin: 1,
                width: 300,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
            });
            logger_1.logger.info(`QR Code generated for branch ${branchId}: ${filename}`);
            // Save to database
            const protocol = req.protocol;
            const host = req.get("host");
            const qrCodeUrl = `${protocol}://${host}/uploads/qrcodes/${filename}`;
            const result = await database_1.pool
                .request()
                .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                .input("qr_code_url", mssql_1.default.NVarChar, qrCodeUrl)
                .input("qr_code_filename", mssql_1.default.NVarChar, filename)
                .input("survey_url", mssql_1.default.NVarChar, surveyUrl).query(`
          INSERT INTO branch_qrcodes (branch_id, qr_code_url, qr_code_filename, survey_url)
          OUTPUT INSERTED.*
          VALUES (@branch_id, @qr_code_url, @qr_code_filename, @survey_url)
        `);
            const qrCode = result.recordset[0];
            res.status(201).json({
                success: true,
                message: "QR Code generated successfully",
                qrCode: {
                    id: qrCode.id,
                    branch_id: qrCode.branch_id,
                    qr_code_url: qrCodeUrl,
                    survey_url: surveyUrl,
                    created_at: qrCode.created_at,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error generating QR Code:", error);
            next(error);
        }
    },
    // Get QR Code for a branch
    getQRCode: async (req, res, next) => {
        try {
            const { branchId } = req.params;
            const result = await database_1.pool
                .request()
                .input("branchId", mssql_1.default.UniqueIdentifier, branchId).query(`
          SELECT qr.*, b.name_ar, b.name_en
          FROM branch_qrcodes qr
          JOIN branches b ON qr.branch_id = b.id
          WHERE qr.branch_id = @branchId AND qr.is_active = 1
        `);
            if (result.recordset.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "QR Code not found for this branch",
                });
                return;
            }
            const qrCode = result.recordset[0];
            const protocol = req.protocol;
            const host = req.get("host");
            res.json({
                success: true,
                qrCode: {
                    id: qrCode.id,
                    branch_id: qrCode.branch_id,
                    branch_name_ar: qrCode.name_ar,
                    branch_name_en: qrCode.name_en,
                    qr_code_url: `${protocol}://${host}/uploads/qrcodes/${qrCode.qr_code_filename}`,
                    survey_url: qrCode.survey_url,
                    created_at: qrCode.created_at,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error fetching QR Code:", error);
            next(error);
        }
    },
    // Get all QR Codes
    getAllQRCodes: async (req, res, next) => {
        try {
            const result = await database_1.pool.request().query(`
        SELECT qr.*, b.name_ar, b.name_en
        FROM branch_qrcodes qr
        JOIN branches b ON qr.branch_id = b.id
        WHERE qr.is_active = 1
        ORDER BY qr.created_at DESC
      `);
            const protocol = req.protocol;
            const host = req.get("host");
            const qrCodes = result.recordset.map((qr) => ({
                id: qr.id,
                branch_id: qr.branch_id,
                branch_name_ar: qr.name_ar,
                branch_name_en: qr.name_en,
                qr_code_url: `${protocol}://${host}/uploads/qrcodes/${qr.qr_code_filename}`,
                survey_url: qr.survey_url,
                created_at: qr.created_at,
            }));
            res.json({
                success: true,
                qrCodes,
            });
        }
        catch (error) {
            logger_1.logger.error("Error fetching QR Codes:", error);
            next(error);
        }
    },
    // Delete QR Code
    deleteQRCode: async (req, res, next) => {
        try {
            const { branchId } = req.params;
            // Get QR code info
            const qrCodeResult = await database_1.pool
                .request()
                .input("branchId", mssql_1.default.UniqueIdentifier, branchId)
                .query("SELECT * FROM branch_qrcodes WHERE branch_id = @branchId");
            if (qrCodeResult.recordset.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "QR Code not found",
                });
                return;
            }
            const qrCode = qrCodeResult.recordset[0];
            // Delete file
            const filePath = path_1.default.join(process.cwd(), "uploads", "qrcodes", qrCode.qr_code_filename);
            try {
                await promises_1.default.unlink(filePath);
                logger_1.logger.info(`QR Code file deleted: ${qrCode.qr_code_filename}`);
            }
            catch (err) {
                logger_1.logger.warn(`Could not delete QR Code file: ${qrCode.qr_code_filename}`);
            }
            // Delete from database
            await database_1.pool
                .request()
                .input("branchId", mssql_1.default.UniqueIdentifier, branchId)
                .query("DELETE FROM branch_qrcodes WHERE branch_id = @branchId");
            res.json({
                success: true,
                message: "QR Code deleted successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error deleting QR Code:", error);
            next(error);
        }
    },
};
//# sourceMappingURL=qrcode.controller.js.map