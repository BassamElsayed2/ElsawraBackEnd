"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesController = void 0;
const categories_service_1 = require("../services/categories.service");
const error_middleware_1 = require("../middleware/error.middleware");
class CategoriesController {
}
exports.CategoriesController = CategoriesController;
_a = CategoriesController;
// Get all categories
CategoriesController.getCategories = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { search, is_active } = req.query;
    const categories = await categories_service_1.CategoriesService.getCategories({
        search,
        is_active: is_active !== undefined ? is_active === "true" : undefined,
    });
    res.json({
        success: true,
        data: { categories },
    });
});
// Get category by ID
CategoriesController.getCategoryById = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const category = await categories_service_1.CategoriesService.getCategoryById(id);
    res.json({
        success: true,
        data: { category },
    });
});
// Create category (admin only)
CategoriesController.createCategory = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const category = await categories_service_1.CategoriesService.createCategory(req.body);
    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: { category },
    });
});
// Update category (admin only)
CategoriesController.updateCategory = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const category = await categories_service_1.CategoriesService.updateCategory(id, req.body);
    res.json({
        success: true,
        message: "Category updated successfully",
        data: { category },
    });
});
// Delete category (admin only)
CategoriesController.deleteCategory = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    await categories_service_1.CategoriesService.deleteCategory(id);
    res.json({
        success: true,
        message: "Category deleted successfully",
    });
});
//# sourceMappingURL=categories.controller.js.map