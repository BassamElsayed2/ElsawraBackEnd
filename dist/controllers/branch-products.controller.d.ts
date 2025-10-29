import { Response, NextFunction } from "express";
export declare class BranchProductsController {
    /**
     * Get all branches for a product
     * GET /api/products/:productId/branches
     */
    static getProductBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Update product branches
     * PUT /api/products/:productId/branches
     */
    static updateProductBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Add product to branches
     * POST /api/products/:productId/branches
     */
    static addProductToBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Remove product from branches
     * DELETE /api/products/:productId/branches
     */
    static removeProductFromBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get all branches for a category
     * GET /api/categories/:categoryId/branches
     */
    static getCategoryBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Update category branches
     * PUT /api/categories/:categoryId/branches
     */
    static updateCategoryBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Add category to branches
     * POST /api/categories/:categoryId/branches
     */
    static addCategoryToBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Remove category from branches
     * DELETE /api/categories/:categoryId/branches
     */
    static removeCategoryFromBranches: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get all products in a branch
     * GET /api/branches/:branchId/products
     */
    static getBranchProducts: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get all categories in a branch
     * GET /api/branches/:branchId/categories
     */
    static getBranchCategories: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=branch-products.controller.d.ts.map