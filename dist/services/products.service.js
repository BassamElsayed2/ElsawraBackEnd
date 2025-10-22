"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
class ProductsService {
    // Get all products with pagination and filters
    static async getProducts(page = 1, limit = 10, filters = {}) {
        const offset = (page - 1) * limit;
        let whereConditions = [];
        const request = database_1.pool.request();
        // Apply filters
        if (filters.category_id) {
            whereConditions.push("p.category_id = @categoryId");
            request.input("categoryId", filters.category_id);
        }
        if (filters.search) {
            whereConditions.push("(p.title_ar LIKE @search OR p.title_en LIKE @search)");
            request.input("search", `%${filters.search}%`);
        }
        if (filters.is_active !== undefined) {
            whereConditions.push("p.is_active = @isActive");
            request.input("isActive", filters.is_active);
        }
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(" AND ")}`
            : "";
        // Get products with types and sizes
        const productsResult = await request
            .input("offset", offset)
            .input("limit", limit).query(`
        SELECT 
          p.id, p.title_ar, p.title_en,
          p.description_ar, p.description_en,
          p.category_id, p.image_url, p.is_active,
          p.created_at, p.updated_at,
          c.name_ar as category_name_ar,
          c.name_en as category_name_en
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY p.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
        const products = productsResult.recordset;
        // Optimize: Get all types and sizes in bulk instead of N+1 queries
        if (products.length > 0) {
            const productIds = products.map((p) => p.id);
            // Get all types for these products in one query using TVP or temp table
            const typesRequest = database_1.pool.request();
            // Create a parameterized query with multiple OR conditions
            const typeWhereConditions = productIds
                .map((_, index) => `product_id = @productId${index}`)
                .join(" OR ");
            productIds.forEach((id, index) => {
                typesRequest.input(`productId${index}`, id);
            });
            const typesResult = await typesRequest.query(`
        SELECT id, product_id, name_ar, name_en, created_at
        FROM product_types
        WHERE ${typeWhereConditions}
        ORDER BY created_at
      `);
            const types = typesResult.recordset;
            // Get all sizes for these types in one query
            if (types.length > 0) {
                const typeIds = types.map((t) => t.id);
                const sizesRequest = database_1.pool.request();
                const sizeWhereConditions = typeIds
                    .map((_, index) => `type_id = @typeId${index}`)
                    .join(" OR ");
                typeIds.forEach((id, index) => {
                    sizesRequest.input(`typeId${index}`, id);
                });
                const sizesResult = await sizesRequest.query(`
          SELECT id, type_id, size_ar, size_en, price, offer_price, created_at
          FROM product_sizes
          WHERE ${sizeWhereConditions}
          ORDER BY price
        `);
                const sizes = sizesResult.recordset;
                // Map sizes to types
                const sizesMap = new Map();
                sizes.forEach((size) => {
                    if (!sizesMap.has(size.type_id)) {
                        sizesMap.set(size.type_id, []);
                    }
                    sizesMap.get(size.type_id).push(size);
                });
                types.forEach((type) => {
                    type.sizes = sizesMap.get(type.id) || [];
                });
            }
            else {
                types.forEach((type) => {
                    type.sizes = [];
                });
            }
            // Map types to products
            const typesMap = new Map();
            types.forEach((type) => {
                if (!typesMap.has(type.product_id)) {
                    typesMap.set(type.product_id, []);
                }
                typesMap.get(type.product_id).push(type);
            });
            products.forEach((product) => {
                product.types = typesMap.get(product.id) || [];
            });
        }
        // Get total count
        const countRequest = database_1.pool.request();
        if (filters.category_id) {
            countRequest.input("categoryId", filters.category_id);
        }
        if (filters.search) {
            countRequest.input("search", `%${filters.search}%`);
        }
        if (filters.is_active !== undefined) {
            countRequest.input("isActive", filters.is_active);
        }
        const countResult = await countRequest.query(`
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `);
        const total = countResult.recordset[0].total;
        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Get product by ID
    static async getProductById(id) {
        const productResult = await database_1.pool.request().input("id", id).query(`
        SELECT 
          p.*,
          c.name_ar as category_name_ar,
          c.name_en as category_name_en
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = @id
      `);
        if (productResult.recordset.length === 0) {
            throw new error_middleware_1.ApiError(404, "Product not found");
        }
        const product = productResult.recordset[0];
        // Get types and sizes
        const typesResult = await database_1.pool.request().input("productId", product.id)
            .query(`
        SELECT id, name_ar, name_en, created_at
        FROM product_types
        WHERE product_id = @productId
      `);
        const types = typesResult.recordset;
        for (const type of types) {
            const sizesResult = await database_1.pool.request().input("typeId", type.id).query(`
          SELECT id, size_ar, size_en, price, offer_price, created_at
          FROM product_sizes
          WHERE type_id = @typeId
        `);
            type.sizes = sizesResult.recordset;
        }
        product.types = types;
        return product;
    }
    // Create product (admin only)
    static async createProduct(data) {
        const { title_ar, title_en, description_ar, description_en, category_id, image_url, types, } = data;
        const transaction = database_1.pool.transaction();
        await transaction.begin();
        try {
            // Create product
            const productResult = await transaction
                .request()
                .input("titleAr", title_ar)
                .input("titleEn", title_en)
                .input("descriptionAr", description_ar || null)
                .input("descriptionEn", description_en || null)
                .input("categoryId", category_id)
                .input("imageUrl", image_url || null).query(`
          INSERT INTO products (title_ar, title_en, description_ar, description_en, category_id, image_url)
          OUTPUT INSERTED.id
          VALUES (@titleAr, @titleEn, @descriptionAr, @descriptionEn, @categoryId, @imageUrl)
        `);
            const productId = productResult.recordset[0].id;
            // Create types and sizes if provided
            if (types && Array.isArray(types)) {
                for (const type of types) {
                    const typeResult = await transaction
                        .request()
                        .input("productId", productId)
                        .input("nameAr", type.name_ar)
                        .input("nameEn", type.name_en).query(`
              INSERT INTO product_types (product_id, name_ar, name_en)
              OUTPUT INSERTED.id
              VALUES (@productId, @nameAr, @nameEn)
            `);
                    const typeId = typeResult.recordset[0].id;
                    if (type.sizes && Array.isArray(type.sizes)) {
                        for (const size of type.sizes) {
                            await transaction
                                .request()
                                .input("typeId", typeId)
                                .input("sizeAr", size.size_ar)
                                .input("sizeEn", size.size_en)
                                .input("price", size.price)
                                .input("offerPrice", size.offer_price || null).query(`
                  INSERT INTO product_sizes (type_id, size_ar, size_en, price, offer_price)
                  VALUES (@typeId, @sizeAr, @sizeEn, @price, @offerPrice)
                `);
                        }
                    }
                }
            }
            await transaction.commit();
            return await this.getProductById(productId);
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // Update product (admin only)
    static async updateProduct(id, data) {
        const { title_ar, title_en, description_ar, description_en, category_id, image_url, is_active, types, } = data;
        const transaction = database_1.pool.transaction();
        await transaction.begin();
        try {
            // Check if product exists
            const existsCheck = await transaction
                .request()
                .input("id", id)
                .query("SELECT id FROM products WHERE id = @id");
            if (existsCheck.recordset.length === 0) {
                throw new error_middleware_1.ApiError(404, "Product not found");
            }
            // Update product
            const updates = [];
            const request = transaction.request().input("id", id);
            if (title_ar !== undefined) {
                updates.push("title_ar = @titleAr");
                request.input("titleAr", title_ar);
            }
            if (title_en !== undefined) {
                updates.push("title_en = @titleEn");
                request.input("titleEn", title_en);
            }
            if (description_ar !== undefined) {
                updates.push("description_ar = @descriptionAr");
                request.input("descriptionAr", description_ar);
            }
            if (description_en !== undefined) {
                updates.push("description_en = @descriptionEn");
                request.input("descriptionEn", description_en);
            }
            if (category_id !== undefined) {
                updates.push("category_id = @categoryId");
                request.input("categoryId", category_id);
            }
            if (image_url !== undefined) {
                updates.push("image_url = @imageUrl");
                request.input("imageUrl", image_url);
            }
            if (is_active !== undefined) {
                updates.push("is_active = @isActive");
                request.input("isActive", is_active);
            }
            if (updates.length > 0) {
                updates.push("updated_at = GETDATE()");
                await request.query(`
          UPDATE products
          SET ${updates.join(", ")}
          WHERE id = @id
        `);
            }
            // Update types if provided
            if (types !== undefined) {
                // Delete existing types and sizes (CASCADE will handle sizes)
                await transaction
                    .request()
                    .input("productId", id)
                    .query("DELETE FROM product_types WHERE product_id = @productId");
                // Create new types and sizes
                if (Array.isArray(types)) {
                    for (const type of types) {
                        const typeResult = await transaction
                            .request()
                            .input("productId", id)
                            .input("nameAr", type.name_ar)
                            .input("nameEn", type.name_en).query(`
                INSERT INTO product_types (product_id, name_ar, name_en)
                OUTPUT INSERTED.id
                VALUES (@productId, @nameAr, @nameEn)
              `);
                        const typeId = typeResult.recordset[0].id;
                        if (type.sizes && Array.isArray(type.sizes)) {
                            for (const size of type.sizes) {
                                await transaction
                                    .request()
                                    .input("typeId", typeId)
                                    .input("sizeAr", size.size_ar)
                                    .input("sizeEn", size.size_en)
                                    .input("price", size.price)
                                    .input("offerPrice", size.offer_price || null).query(`
                    INSERT INTO product_sizes (type_id, size_ar, size_en, price, offer_price)
                    VALUES (@typeId, @sizeAr, @sizeEn, @price, @offerPrice)
                  `);
                            }
                        }
                    }
                }
            }
            await transaction.commit();
            return await this.getProductById(id);
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // Delete product (admin only)
    static async deleteProduct(id) {
        const result = await database_1.pool
            .request()
            .input("id", id)
            .query("DELETE FROM products WHERE id = @id");
        if (result.rowsAffected[0] === 0) {
            throw new error_middleware_1.ApiError(404, "Product not found");
        }
        return { success: true };
    }
}
exports.ProductsService = ProductsService;
//# sourceMappingURL=products.service.js.map