"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const products_service_1 = require("../services/products.service");
const error_middleware_1 = require("../middleware/error.middleware");
class ProductsController {
}
exports.ProductsController = ProductsController;
_a = ProductsController;
// Get all products
ProductsController.getProducts = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { page, limit, category_id, search, is_active } = req.query;
    const result = await products_service_1.ProductsService.getProducts(parseInt(page) || 1, parseInt(limit) || 10, { category_id, search, is_active });
    res.json({
        success: true,
        data: result,
    });
});
// Get product by ID
ProductsController.getProductById = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const product = await products_service_1.ProductsService.getProductById(id);
    res.json({
        success: true,
        data: { product },
    });
});
// Create product (admin only)
ProductsController.createProduct = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const product = await products_service_1.ProductsService.createProduct(req.body);
    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: { product },
    });
});
// Update product (admin only)
ProductsController.updateProduct = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const product = await products_service_1.ProductsService.updateProduct(id, req.body);
    res.json({
        success: true,
        message: "Product updated successfully",
        data: { product },
    });
});
// Delete product (admin only)
ProductsController.deleteProduct = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    await products_service_1.ProductsService.deleteProduct(id);
    res.json({
        success: true,
        message: "Product deleted successfully",
    });
});
//# sourceMappingURL=products.controller.js.map