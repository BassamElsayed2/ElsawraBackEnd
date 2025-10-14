import { Router } from "express";
import { CategoriesController } from "../controllers/categories.controller";
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

export default router;
