"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const distance_1 = require("../utils/distance");
class DeliveryService {
    // Calculate delivery fee based on distance
    static async calculateDeliveryFee(params) {
        const { user_latitude, user_longitude, branch_id } = params;
        // Get all active branches or specific branch
        // Support both lat/lng and latitude/longitude column names
        let branchQuery = `
      SELECT id, name_ar, name_en, address_ar, address_en, 
             COALESCE(lat, latitude) as latitude,
             COALESCE(lng, longitude) as longitude
      FROM branches
      WHERE is_active = 1 
        AND (lat IS NOT NULL OR latitude IS NOT NULL)
        AND (lng IS NOT NULL OR longitude IS NOT NULL)
    `;
        const request = database_1.pool.request();
        if (branch_id) {
            branchQuery += " AND id = @branch_id";
            request.input("branch_id", branch_id);
        }
        const branchesResult = await request.query(branchQuery);
        if (branchesResult.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "No active branches found with valid coordinates");
        }
        // Find nearest branch
        const nearest = (0, distance_1.findNearestBranch)(user_latitude, user_longitude, branchesResult.recordset);
        if (!nearest) {
            throw new error_middleware_1.ApiError(500, "Failed to calculate distance");
        }
        // Get active delivery fee configurations
        const configsResult = await database_1.pool.query(`
      SELECT *
      FROM delivery_fees_config
      WHERE is_active = 1
      ORDER BY min_distance_km
    `);
        if (configsResult.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "No active delivery fee configurations found");
        }
        // Find the maximum delivery distance from all active configs
        const maxDeliveryDistance = Math.max(...configsResult.recordset.map((c) => c.max_distance_km));
        // Check if the customer's distance exceeds the maximum
        if (nearest.distance > maxDeliveryDistance) {
            throw new error_middleware_1.ApiError(400, `عذراً، التوصيل غير متاح لهذه المسافة (${nearest.distance.toFixed(2)} كم). أقصى مسافة توصيل هي ${maxDeliveryDistance} كم.`);
        }
        // Find the appropriate fee config for this distance
        const applicableConfig = configsResult.recordset.find((config) => nearest.distance >= config.min_distance_km &&
            nearest.distance <= config.max_distance_km);
        if (!applicableConfig) {
            throw new error_middleware_1.ApiError(404, `لم يتم العثور على رسوم توصيل لهذه المسافة (${nearest.distance.toFixed(2)} كم)`);
        }
        return {
            fee: applicableConfig.fee,
            distance_km: nearest.distance,
            nearest_branch: {
                id: nearest.branch.id,
                name_ar: nearest.branch.name_ar,
                name_en: nearest.branch.name_en,
                address_ar: nearest.branch.address_ar,
                address_en: nearest.branch.address_en,
            },
        };
    }
    // Get all delivery fee configurations
    static async getDeliveryFeeConfigs() {
        const result = await database_1.pool.query(`
      SELECT *
      FROM delivery_fees_config
      ORDER BY min_distance_km
    `);
        return result.recordset;
    }
    // Create delivery fee configuration
    static async createDeliveryFeeConfig(config) {
        const result = await database_1.pool
            .request()
            .input("min_distance_km", config.min_distance_km)
            .input("max_distance_km", config.max_distance_km)
            .input("fee", config.fee).query(`
        INSERT INTO delivery_fees_config (min_distance_km, max_distance_km, fee)
        OUTPUT INSERTED.*
        VALUES (@min_distance_km, @max_distance_km, @fee)
      `);
        return result.recordset[0];
    }
    // Update delivery fee configuration
    static async updateDeliveryFeeConfig(id, config) {
        const updates = [];
        const request = database_1.pool.request().input("id", id);
        // Helper function to check if value is valid (not null, undefined, or NaN)
        const isValidValue = (value) => {
            return value !== undefined && value !== null && !Number.isNaN(value);
        };
        if (isValidValue(config.min_distance_km)) {
            updates.push("min_distance_km = @min_distance_km");
            request.input("min_distance_km", config.min_distance_km);
        }
        if (isValidValue(config.max_distance_km)) {
            updates.push("max_distance_km = @max_distance_km");
            request.input("max_distance_km", config.max_distance_km);
        }
        if (isValidValue(config.fee)) {
            updates.push("fee = @fee");
            request.input("fee", config.fee);
        }
        // Boolean can be false, so check explicitly for undefined/null
        if (config.is_active !== undefined && config.is_active !== null) {
            updates.push("is_active = @is_active");
            request.input("is_active", config.is_active);
        }
        if (updates.length === 0) {
            throw new error_middleware_1.ApiError(400, "No valid fields to update");
        }
        updates.push("updated_at = GETDATE()");
        const result = await request.query(`
      UPDATE delivery_fees_config
      SET ${updates.join(", ")}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
        if (result.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "Delivery fee configuration not found");
        }
        return result.recordset[0];
    }
    // Delete delivery fee configuration
    static async deleteDeliveryFeeConfig(id) {
        const result = await database_1.pool
            .request()
            .input("id", id)
            .query("DELETE FROM delivery_fees_config WHERE id = @id");
        if (result.rowsAffected[0] === 0) {
            throw new error_middleware_1.ApiError(404, "Delivery fee configuration not found");
        }
    }
}
exports.DeliveryService = DeliveryService;
//# sourceMappingURL=delivery.service.js.map