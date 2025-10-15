"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchesController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const mssql_1 = __importDefault(require("mssql"));
exports.branchesController = {
    // Get all branches
    getAllBranches: async (req, res, next) => {
        try {
            const { is_active, search } = req.query;
            let query = `
        SELECT 
          id, name_ar, name_en, address_ar, address_en,
          phone,  lat, lng, image_url, is_active,
          created_at, updated_at
        FROM branches
        WHERE 1=1
      `;
            const request = database_1.pool.request();
            if (is_active !== undefined) {
                query += " AND is_active = @isActive";
                request.input("isActive", mssql_1.default.Bit, is_active === "true" ? 1 : 0);
            }
            if (search) {
                query += ` AND (
          name_ar LIKE @search OR 
          name_en LIKE @search OR 
          address_ar LIKE @search OR 
          address_en LIKE @search
        )`;
                request.input("search", mssql_1.default.NVarChar, `%${search}%`);
            }
            query += " ORDER BY created_at DESC";
            const result = await request.query(query);
            res.json({
                success: true,
                branches: result.recordset,
            });
        }
        catch (error) {
            logger_1.logger.error("Error fetching branches:", error);
            next(error);
        }
    },
    // Get branch by ID
    getBranchById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await database_1.pool.request().input("id", mssql_1.default.UniqueIdentifier, id)
                .query(`
          SELECT 
            id, name_ar, name_en, address_ar, address_en,
            phone,  lat, lng, image_url, is_active,
            created_at, updated_at
          FROM branches
          WHERE id = @id
        `);
            if (result.recordset.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Branch not found",
                });
                return;
            }
            res.json({
                success: true,
                branch: result.recordset[0],
            });
        }
        catch (error) {
            logger_1.logger.error("Error fetching branch:", error);
            next(error);
        }
    },
    // Create new branch
    createBranch: async (req, res, next) => {
        try {
            const { name_ar, name_en, address_ar, address_en, phone, lat, lng, image_url, is_active = true, } = req.body;
            const result = await database_1.pool
                .request()
                .input("name_ar", mssql_1.default.NVarChar, name_ar)
                .input("name_en", mssql_1.default.NVarChar, name_en)
                .input("address_ar", mssql_1.default.NVarChar, address_ar)
                .input("address_en", mssql_1.default.NVarChar, address_en)
                .input("phone", mssql_1.default.NVarChar, phone || null)
                .input("lat", mssql_1.default.Decimal(10, 8), lat || 0)
                .input("lng", mssql_1.default.Decimal(11, 8), lng || 0)
                .input("image_url", mssql_1.default.NVarChar, image_url || null)
                .input("is_active", mssql_1.default.Bit, is_active ? 1 : 0).query(`
          INSERT INTO branches (
            name_ar, name_en, address_ar, address_en,
            phone,  lat, lng, image_url, is_active
          )
          OUTPUT INSERTED.*
          VALUES (
            @name_ar, @name_en, @address_ar, @address_en,
            @phone,  @lat, @lng, @image_url, @is_active
          )
        `);
            logger_1.logger.info(`Branch created: ${result.recordset[0].id}`);
            res.status(201).json({
                success: true,
                message: "Branch created successfully",
                branch: result.recordset[0],
            });
        }
        catch (error) {
            logger_1.logger.error("Error creating branch:", error);
            next(error);
        }
    },
    // Update branch
    updateBranch: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name_ar, name_en, address_ar, address_en, phone, lat, lng, image_url, is_active, } = req.body;
            const request = database_1.pool.request().input("id", mssql_1.default.UniqueIdentifier, id);
            const updates = [];
            if (name_ar !== undefined) {
                updates.push("name_ar = @name_ar");
                request.input("name_ar", mssql_1.default.NVarChar, name_ar);
            }
            if (name_en !== undefined) {
                updates.push("name_en = @name_en");
                request.input("name_en", mssql_1.default.NVarChar, name_en);
            }
            if (address_ar !== undefined) {
                updates.push("address_ar = @address_ar");
                request.input("address_ar", mssql_1.default.NVarChar, address_ar);
            }
            if (address_en !== undefined) {
                updates.push("address_en = @address_en");
                request.input("address_en", mssql_1.default.NVarChar, address_en);
            }
            if (phone !== undefined) {
                updates.push("phone = @phone");
                request.input("phone", mssql_1.default.NVarChar, phone);
            }
            if (lat !== undefined) {
                updates.push("lat = @lat");
                request.input("lat", mssql_1.default.Decimal(10, 8), lat);
            }
            if (lng !== undefined) {
                updates.push("lng = @lng");
                request.input("lng", mssql_1.default.Decimal(11, 8), lng);
            }
            if (image_url !== undefined) {
                updates.push("image_url = @image_url");
                request.input("image_url", mssql_1.default.NVarChar, image_url);
            }
            if (is_active !== undefined) {
                updates.push("is_active = @is_active");
                request.input("is_active", mssql_1.default.Bit, is_active ? 1 : 0);
            }
            if (updates.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No fields to update",
                });
                return;
            }
            updates.push("updated_at = GETUTCDATE()");
            const result = await request.query(`
        UPDATE branches
        SET ${updates.join(", ")}
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
            if (result.recordset.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Branch not found",
                });
                return;
            }
            logger_1.logger.info(`Branch updated: ${id}`);
            res.json({
                success: true,
                message: "Branch updated successfully",
                branch: result.recordset[0],
            });
        }
        catch (error) {
            logger_1.logger.error("Error updating branch:", error);
            next(error);
        }
    },
    // Delete branch
    deleteBranch: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await database_1.pool.request().input("id", mssql_1.default.UniqueIdentifier, id)
                .query(`
          DELETE FROM branches
          OUTPUT DELETED.id
          WHERE id = @id
        `);
            if (result.recordset.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Branch not found",
                });
                return;
            }
            logger_1.logger.info(`Branch deleted: ${id}`);
            res.json({
                success: true,
                message: "Branch deleted successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error deleting branch:", error);
            next(error);
        }
    },
};
//# sourceMappingURL=branches.controller.js.map