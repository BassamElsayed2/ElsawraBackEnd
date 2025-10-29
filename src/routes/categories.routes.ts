import { Router } from "express";
import { CategoriesController } from "../controllers/categories.controller";
import { BranchProductsController } from "../controllers/branch-products.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validation.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
} from "../validators/categories.validators";
import { z } from "zod";

const router = Router();

// Public routes
router.get(
  "/",
  validateQuery(getCategoriesQuerySchema),
  CategoriesController.getCategories
);
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  CategoriesController.getCategoryById
);

// Admin routes
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateBody(createCategorySchema),
  CategoriesController.createCategory
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateCategorySchema),
  CategoriesController.updateCategory
);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  CategoriesController.deleteCategory
);

// ============================================
// CATEGORY-BRANCH MANAGEMENT ROUTES
// ============================================

// Get branches for a category
router.get(
  "/:categoryId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ categoryId: z.string().uuid() })),
  BranchProductsController.getCategoryBranches
);

// Update category branches (replace all)
router.put(
  "/:categoryId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ categoryId: z.string().uuid() })),
  validateBody(z.object({ branch_ids: z.array(z.string().uuid()) })),
  BranchProductsController.updateCategoryBranches
);

// Add category to branches
router.post(
  "/:categoryId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ categoryId: z.string().uuid() })),
  validateBody(z.object({ branch_ids: z.array(z.string().uuid()) })),
  BranchProductsController.addCategoryToBranches
);

// Remove category from branches
router.delete(
  "/:categoryId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ categoryId: z.string().uuid() })),
  validateBody(z.object({ branch_ids: z.array(z.string().uuid()) })),
  BranchProductsController.removeCategoryFromBranches
);

export default router;
