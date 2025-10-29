"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchProductsService = void 0;
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
class BranchProductsService {
    // ============================================
    // PRODUCTS IN BRANCHES
    // ============================================
    /**
     * Add product to specific branches
     */
    static async addProductToBranches(productId, branchIds) {
        const transaction = database_1.pool.transaction();
        try {
            await transaction.begin();
            for (const branchId of branchIds) {
                await transaction
                    .request()
                    .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                    .input("product_id", mssql_1.default.UniqueIdentifier, productId).query(`
            IF NOT EXISTS (
              SELECT 1 FROM branch_products 
              WHERE branch_id = @branch_id AND product_id = @product_id
            )
            BEGIN
              INSERT INTO branch_products (branch_id, product_id, is_available)
              VALUES (@branch_id, @product_id, 1)
            END
          `);
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Remove product from specific branches
     */
    static async removeProductFromBranches(productId, branchIds) {
        const transaction = database_1.pool.transaction();
        try {
            await transaction.begin();
            for (const branchId of branchIds) {
                await transaction
                    .request()
                    .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                    .input("product_id", mssql_1.default.UniqueIdentifier, productId).query(`
            DELETE FROM branch_products 
            WHERE branch_id = @branch_id AND product_id = @product_id
          `);
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Get all branches for a specific product
     */
    static async getProductBranches(productId) {
        const result = await database_1.pool
            .request()
            .input("product_id", mssql_1.default.UniqueIdentifier, productId).query(`
        SELECT 
          b.id,
          b.name_ar,
          b.name_en,
          b.phone,
          b.address_ar,
          b.address_en,
          bp.is_available,
          bp.created_at
        FROM branches b
        INNER JOIN branch_products bp ON b.id = bp.branch_id
        WHERE bp.product_id = @product_id
        ORDER BY b.name_ar
      `);
        return result.recordset;
    }
    /**
     * Update product branches (replace all)
     */
    static async updateProductBranches(productId, branchIds) {
        const transaction = database_1.pool.transaction();
        try {
            await transaction.begin();
            // Delete all existing associations
            await transaction
                .request()
                .input("product_id", mssql_1.default.UniqueIdentifier, productId)
                .query(`DELETE FROM branch_products WHERE product_id = @product_id`);
            // Add new associations
            for (const branchId of branchIds) {
                await transaction
                    .request()
                    .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                    .input("product_id", mssql_1.default.UniqueIdentifier, productId).query(`
            INSERT INTO branch_products (branch_id, product_id, is_available)
            VALUES (@branch_id, @product_id, 1)
          `);
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // ============================================
    // CATEGORIES IN BRANCHES
    // ============================================
    /**
     * Add category to specific branches
     */
    static async addCategoryToBranches(categoryId, branchIds) {
        const transaction = database_1.pool.transaction();
        try {
            await transaction.begin();
            for (const branchId of branchIds) {
                await transaction
                    .request()
                    .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                    .input("category_id", mssql_1.default.UniqueIdentifier, categoryId).query(`
            IF NOT EXISTS (
              SELECT 1 FROM branch_categories 
              WHERE branch_id = @branch_id AND category_id = @category_id
            )
            BEGIN
              INSERT INTO branch_categories (branch_id, category_id, is_available, display_order)
              VALUES (@branch_id, @category_id, 1, 0)
            END
          `);
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Remove category from specific branches
     */
    static async removeCategoryFromBranches(categoryId, branchIds) {
        const transaction = database_1.pool.transaction();
        try {
            await transaction.begin();
            for (const branchId of branchIds) {
                await transaction
                    .request()
                    .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                    .input("category_id", mssql_1.default.UniqueIdentifier, categoryId).query(`
            DELETE FROM branch_categories 
            WHERE branch_id = @branch_id AND category_id = @category_id
          `);
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Get all branches for a specific category
     */
    static async getCategoryBranches(categoryId) {
        const result = await database_1.pool
            .request()
            .input("category_id", mssql_1.default.UniqueIdentifier, categoryId).query(`
        SELECT 
          b.id,
          b.name_ar,
          b.name_en,
          b.phone,
          b.address_ar,
          b.address_en,
          bc.is_available,
          bc.display_order,
          bc.created_at
        FROM branches b
        INNER JOIN branch_categories bc ON b.id = bc.branch_id
        WHERE bc.category_id = @category_id
        ORDER BY bc.display_order, b.name_ar
      `);
        return result.recordset;
    }
    /**
     * Update category branches (replace all)
     */
    static async updateCategoryBranches(categoryId, branchIds) {
        const transaction = database_1.pool.transaction();
        try {
            await transaction.begin();
            // Delete all existing associations
            await transaction
                .request()
                .input("category_id", mssql_1.default.UniqueIdentifier, categoryId)
                .query(`DELETE FROM branch_categories WHERE category_id = @category_id`);
            // Add new associations
            for (const branchId of branchIds) {
                await transaction
                    .request()
                    .input("branch_id", mssql_1.default.UniqueIdentifier, branchId)
                    .input("category_id", mssql_1.default.UniqueIdentifier, categoryId).query(`
            INSERT INTO branch_categories (branch_id, category_id, is_available, display_order)
            VALUES (@branch_id, @category_id, 1, 0)
          `);
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Get all products for a specific branch
     */
    static async getBranchProducts(branchId) {
        const result = await database_1.pool
            .request()
            .input("branch_id", mssql_1.default.UniqueIdentifier, branchId).query(`
        SELECT 
          p.id,
          p.title_ar,
          p.title_en,
          p.image_url,
          p.category_id,
          bp.is_available,
          bp.created_at
        FROM products p
        INNER JOIN branch_products bp ON p.id = bp.product_id
        WHERE bp.branch_id = @branch_id
        ORDER BY p.title_ar
      `);
        return result.recordset;
    }
    /**
     * Get all categories for a specific branch
     */
    static async getBranchCategories(branchId) {
        const result = await database_1.pool
            .request()
            .input("branch_id", mssql_1.default.UniqueIdentifier, branchId).query(`
        SELECT 
          c.id,
          c.name_ar,
          c.name_en,
          c.image_url,
          bc.is_available,
          bc.display_order,
          bc.created_at
        FROM categories c
        INNER JOIN branch_categories bc ON c.id = bc.category_id
        WHERE bc.branch_id = @branch_id
        ORDER BY bc.display_order, c.name_ar
      `);
        return result.recordset;
    }
}
exports.BranchProductsService = BranchProductsService;
//# sourceMappingURL=branch-products.service.js.map