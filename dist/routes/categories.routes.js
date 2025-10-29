"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controller_1 = require("../controllers/categories.controller");
const branch_products_controller_1 = require("../controllers/branch-products.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const categories_validators_1 = require("../validators/categories.validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Public routes
router.get("/", (0, validation_middleware_1.validateQuery)(categories_validators_1.getCategoriesQuerySchema), categories_controller_1.CategoriesController.getCategories);
router.get("/:id", (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), categories_controller_1.CategoriesController.getCategoryById);
// Admin routes
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateBody)(categories_validators_1.createCategorySchema), categories_controller_1.CategoriesController.createCategory);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(categories_validators_1.updateCategorySchema), categories_controller_1.CategoriesController.updateCategory);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), categories_controller_1.CategoriesController.deleteCategory);
// ============================================
// CATEGORY-BRANCH MANAGEMENT ROUTES
// ============================================
// Get branches for a category
router.get("/:categoryId/branches", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ categoryId: zod_1.z.string().uuid() })), branch_products_controller_1.BranchProductsController.getCategoryBranches);
// Update category branches (replace all)
router.put("/:categoryId/branches", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ categoryId: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(zod_1.z.object({ branch_ids: zod_1.z.array(zod_1.z.string().uuid()) })), branch_products_controller_1.BranchProductsController.updateCategoryBranches);
// Add category to branches
router.post("/:categoryId/branches", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ categoryId: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(zod_1.z.object({ branch_ids: zod_1.z.array(zod_1.z.string().uuid()) })), branch_products_controller_1.BranchProductsController.addCategoryToBranches);
// Remove category from branches
router.delete("/:categoryId/branches", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ categoryId: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(zod_1.z.object({ branch_ids: zod_1.z.array(zod_1.z.string().uuid()) })), branch_products_controller_1.BranchProductsController.removeCategoryFromBranches);
exports.default = router;
//# sourceMappingURL=categories.routes.js.map