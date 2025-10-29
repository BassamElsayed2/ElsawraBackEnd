import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ProductsService } from "../services/products.service";
import { asyncHandler } from "../middleware/error.middleware";

export class ProductsController {
  // Get all products
  static getProducts = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { page, limit, category_id, search, is_active, branch_id } =
        req.query as any;

      const result = await ProductsService.getProducts(
        parseInt(page) || 1,
        parseInt(limit) || 10,
        { category_id, search, is_active, branch_id }
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Get product by ID
  static getProductById = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const product = await ProductsService.getProductById(id);

      res.json({
        success: true,
        data: { product },
      });
    }
  );

  // Create product (admin only)
  static createProduct = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const product = await ProductsService.createProduct(req.body);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: { product },
      });
    }
  );

  // Update product (admin only)
  static updateProduct = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const product = await ProductsService.updateProduct(id, req.body);

      res.json({
        success: true,
        message: "Product updated successfully",
        data: { product },
      });
    }
  );

  // Delete product (admin only)
  static deleteProduct = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await ProductsService.deleteProduct(id);

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    }
  );
}
