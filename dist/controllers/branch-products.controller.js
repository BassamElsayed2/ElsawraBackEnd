"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchProductsController = void 0;
const branch_products_service_1 = require("../services/branch-products.service");
const error_middleware_1 = require("../middleware/error.middleware");
class BranchProductsController {
}
exports.BranchProductsController = BranchProductsController;
_a = BranchProductsController;
// ============================================
// PRODUCT-BRANCH MANAGEMENT
// ============================================
/**
 * Get all branches for a product
 * GET /api/products/:productId/branches
 */
BranchProductsController.getProductBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { productId } = req.params;
    const branches = await branch_products_service_1.BranchProductsService.getProductBranches(productId);
    res.json({
        success: true,
        data: { branches },
    });
});
/**
 * Update product branches
 * PUT /api/products/:productId/branches
 */
BranchProductsController.updateProductBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { productId } = req.params;
    const { branch_ids } = req.body;
    await branch_products_service_1.BranchProductsService.updateProductBranches(productId, branch_ids);
    res.json({
        success: true,
        message: "Product branches updated successfully",
    });
});
/**
 * Add product to branches
 * POST /api/products/:productId/branches
 */
BranchProductsController.addProductToBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { productId } = req.params;
    const { branch_ids } = req.body;
    await branch_products_service_1.BranchProductsService.addProductToBranches(productId, branch_ids);
    res.json({
        success: true,
        message: "Product added to branches successfully",
    });
});
/**
 * Remove product from branches
 * DELETE /api/products/:productId/branches
 */
BranchProductsController.removeProductFromBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { productId } = req.params;
    const { branch_ids } = req.body;
    await branch_products_service_1.BranchProductsService.removeProductFromBranches(productId, branch_ids);
    res.json({
        success: true,
        message: "Product removed from branches successfully",
    });
});
// ============================================
// CATEGORY-BRANCH MANAGEMENT
// ============================================
/**
 * Get all branches for a category
 * GET /api/categories/:categoryId/branches
 */
BranchProductsController.getCategoryBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { categoryId } = req.params;
    const branches = await branch_products_service_1.BranchProductsService.getCategoryBranches(categoryId);
    res.json({
        success: true,
        data: { branches },
    });
});
/**
 * Update category branches
 * PUT /api/categories/:categoryId/branches
 */
BranchProductsController.updateCategoryBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { categoryId } = req.params;
    const { branch_ids } = req.body;
    await branch_products_service_1.BranchProductsService.updateCategoryBranches(categoryId, branch_ids);
    res.json({
        success: true,
        message: "Category branches updated successfully",
    });
});
/**
 * Add category to branches
 * POST /api/categories/:categoryId/branches
 */
BranchProductsController.addCategoryToBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { categoryId } = req.params;
    const { branch_ids } = req.body;
    await branch_products_service_1.BranchProductsService.addCategoryToBranches(categoryId, branch_ids);
    res.json({
        success: true,
        message: "Category added to branches successfully",
    });
});
/**
 * Remove category from branches
 * DELETE /api/categories/:categoryId/branches
 */
BranchProductsController.removeCategoryFromBranches = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { categoryId } = req.params;
    const { branch_ids } = req.body;
    await branch_products_service_1.BranchProductsService.removeCategoryFromBranches(categoryId, branch_ids);
    res.json({
        success: true,
        message: "Category removed from branches successfully",
    });
});
// ============================================
// BRANCH-SPECIFIC QUERIES
// ============================================
/**
 * Get all products in a branch
 * GET /api/branches/:branchId/products
 */
BranchProductsController.getBranchProducts = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { branchId } = req.params;
    const products = await branch_products_service_1.BranchProductsService.getBranchProducts(branchId);
    res.json({
        success: true,
        data: { products },
    });
});
/**
 * Get all categories in a branch
 * GET /api/branches/:branchId/categories
 */
BranchProductsController.getBranchCategories = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { branchId } = req.params;
    const categories = await branch_products_service_1.BranchProductsService.getBranchCategories(branchId);
    res.json({
        success: true,
        data: { categories },
    });
});
//# sourceMappingURL=branch-products.controller.js.map