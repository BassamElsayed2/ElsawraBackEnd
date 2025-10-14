import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { CategoriesService } from "../services/categories.service";
import { asyncHandler } from "../middleware/error.middleware";

export class CategoriesController {
  // Get all categories
  static getCategories = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { search, is_active } = req.query as any;

      const categories = await CategoriesService.getCategories({
        search,
        is_active: is_active !== undefined ? is_active === "true" : undefined,
      });

      res.json({
        success: true,
        data: { categories },
      });
    }
  );

  // Get category by ID
  static getCategoryById = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const category = await CategoriesService.getCategoryById(id);

      res.json({
        success: true,
        data: { category },
      });
    }
  );

  // Create category (admin only)
  static createCategory = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const category = await CategoriesService.createCategory(req.body);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: { category },
      });
    }
  );

  // Update category (admin only)
  static updateCategory = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const category = await CategoriesService.updateCategory(id, req.body);

      res.json({
        success: true,
        message: "Category updated successfully",
        data: { category },
      });
    }
  );

  // Delete category (admin only)
  static deleteCategory = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await CategoriesService.deleteCategory(id);

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    }
  );
}
