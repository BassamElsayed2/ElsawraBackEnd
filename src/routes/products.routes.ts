import { Router } from "express";
import { ProductsController } from "../controllers/products.controller";
import { BranchProductsController } from "../controllers/branch-products.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
} from "../validators/products.validators";
import { z } from "zod";

const router = Router();

// Public routes
router.get(
  "/",
  validateQuery(getProductsQuerySchema),
  ProductsController.getProducts
);
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  ProductsController.getProductById
);

// Admin routes
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateBody(createProductSchema),
  ProductsController.createProduct
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateProductSchema),
  ProductsController.updateProduct
);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ id: z.string().uuid() })),
  ProductsController.deleteProduct
);

// ============================================
// PRODUCT-BRANCH MANAGEMENT ROUTES
// ============================================

// Get branches for a product
router.get(
  "/:productId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ productId: z.string().uuid() })),
  BranchProductsController.getProductBranches
);

// Update product branches (replace all)
router.put(
  "/:productId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ productId: z.string().uuid() })),
  validateBody(z.object({ branch_ids: z.array(z.string().uuid()) })),
  BranchProductsController.updateProductBranches
);

// Add product to branches
router.post(
  "/:productId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ productId: z.string().uuid() })),
  validateBody(z.object({ branch_ids: z.array(z.string().uuid()) })),
  BranchProductsController.addProductToBranches
);

// Remove product from branches
router.delete(
  "/:productId/branches",
  authMiddleware,
  adminMiddleware,
  validateParams(z.object({ productId: z.string().uuid() })),
  validateBody(z.object({ branch_ids: z.array(z.string().uuid()) })),
  BranchProductsController.removeProductFromBranches
);

export default router;
