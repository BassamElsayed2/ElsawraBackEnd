"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressesController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class AddressesController {
    // Get user addresses
    static async getUserAddresses(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const result = await database_1.pool.request().input("userId", userId).query(`
          SELECT 
            id,
            user_id,
            title,
            street,
            building,
            floor,
            apartment,
            city,
            area,
            latitude,
            longitude,
            notes,
            is_default,
            created_at
          FROM addresses
          WHERE user_id = @userId
          ORDER BY is_default DESC, created_at DESC
        `);
            res.status(200).json({
                success: true,
                data: result.recordset,
            });
        }
        catch (error) {
            logger_1.logger.error("Error getting user addresses:", error);
            next(error);
        }
    }
    // Create address
    static async createAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { title, street, building, floor, apartment, city, area, latitude, longitude, notes, is_default, } = req.body;
            // If this is set as default, unset other defaults
            if (is_default) {
                await database_1.pool.request().input("userId", userId).query(`
            UPDATE addresses
            SET is_default = 0
            WHERE user_id = @userId
          `);
            }
            const result = await database_1.pool
                .request()
                .input("userId", userId)
                .input("title", title)
                .input("street", street)
                .input("building", building || null)
                .input("floor", floor || null)
                .input("apartment", apartment || null)
                .input("city", city)
                .input("area", area)
                .input("latitude", latitude)
                .input("longitude", longitude)
                .input("notes", notes || null)
                .input("isDefault", is_default || false).query(`
          INSERT INTO addresses (
            user_id, title, street, building, floor, apartment,
            city, area, latitude, longitude, notes, is_default
          )
          OUTPUT INSERTED.*
          VALUES (
            @userId, @title, @street, @building, @floor, @apartment,
            @city, @area, @latitude, @longitude, @notes, @isDefault
          )
        `);
            res.status(201).json({
                success: true,
                data: result.recordset[0],
                message: "Address created successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error creating address:", error);
            next(error);
        }
    }
    // Update address
    static async updateAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { title, street, building, floor, apartment, city, area, latitude, longitude, notes, is_default, } = req.body;
            // Check if address belongs to user
            const checkResult = await database_1.pool
                .request()
                .input("id", id)
                .input("userId", userId).query(`
          SELECT id FROM addresses
          WHERE id = @id AND user_id = @userId
        `);
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Address not found or unauthorized",
                });
            }
            // If this is set as default, unset other defaults
            if (is_default) {
                await database_1.pool.request().input("userId", userId).query(`
            UPDATE addresses
            SET is_default = 0
            WHERE user_id = @userId
          `);
            }
            const result = await database_1.pool
                .request()
                .input("id", id)
                .input("title", title)
                .input("street", street)
                .input("building", building || null)
                .input("floor", floor || null)
                .input("apartment", apartment || null)
                .input("city", city)
                .input("area", area)
                .input("latitude", latitude)
                .input("longitude", longitude)
                .input("notes", notes || null)
                .input("isDefault", is_default || false).query(`
          UPDATE addresses
          SET 
            title = @title,
            street = @street,
            building = @building,
            floor = @floor,
            apartment = @apartment,
            city = @city,
            area = @area,
            latitude = @latitude,
            longitude = @longitude,
            notes = @notes,
            is_default = @isDefault
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
            res.status(200).json({
                success: true,
                data: result.recordset[0],
                message: "Address updated successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error updating address:", error);
            next(error);
        }
    }
    // Delete address
    static async deleteAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            // Check if address belongs to user
            const checkResult = await database_1.pool
                .request()
                .input("id", id)
                .input("userId", userId).query(`
          SELECT id FROM addresses
          WHERE id = @id AND user_id = @userId
        `);
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Address not found or unauthorized",
                });
            }
            // Check if address is linked to any orders
            const ordersCheck = await database_1.pool.request().input("addressId", id).query(`
          SELECT COUNT(*) as order_count 
          FROM orders 
          WHERE address_id = @addressId
        `);
            if (ordersCheck.recordset[0].order_count > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete address. It is linked to existing orders.",
                    code: "ADDRESS_HAS_ORDERS",
                });
            }
            await database_1.pool.request().input("id", id).query(`
          DELETE FROM addresses
          WHERE id = @id
        `);
            res.status(200).json({
                success: true,
                message: "Address deleted successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error deleting address:", error);
            next(error);
        }
    }
    // Set default address
    static async setDefaultAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            // Check if address belongs to user
            const checkResult = await database_1.pool
                .request()
                .input("id", id)
                .input("userId", userId).query(`
          SELECT id FROM addresses
          WHERE id = @id AND user_id = @userId
        `);
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Address not found or unauthorized",
                });
            }
            // Unset all other defaults for this user
            await database_1.pool.request().input("userId", userId).query(`
          UPDATE addresses
          SET is_default = 0
          WHERE user_id = @userId
        `);
            // Set this address as default
            await database_1.pool.request().input("id", id).query(`
          UPDATE addresses
          SET is_default = 1
          WHERE id = @id
        `);
            res.status(200).json({
                success: true,
                message: "Default address updated successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error setting default address:", error);
            next(error);
        }
    }
}
exports.AddressesController = AddressesController;
//# sourceMappingURL=addresses.controller.js.map