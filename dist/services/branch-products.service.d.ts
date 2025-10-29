export declare class BranchProductsService {
    /**
     * Add product to specific branches
     */
    static addProductToBranches(productId: string, branchIds: string[]): Promise<void>;
    /**
     * Remove product from specific branches
     */
    static removeProductFromBranches(productId: string, branchIds: string[]): Promise<void>;
    /**
     * Get all branches for a specific product
     */
    static getProductBranches(productId: string): Promise<any[]>;
    /**
     * Update product branches (replace all)
     */
    static updateProductBranches(productId: string, branchIds: string[]): Promise<void>;
    /**
     * Add category to specific branches
     */
    static addCategoryToBranches(categoryId: string, branchIds: string[]): Promise<void>;
    /**
     * Remove category from specific branches
     */
    static removeCategoryFromBranches(categoryId: string, branchIds: string[]): Promise<void>;
    /**
     * Get all branches for a specific category
     */
    static getCategoryBranches(categoryId: string): Promise<any[]>;
    /**
     * Update category branches (replace all)
     */
    static updateCategoryBranches(categoryId: string, branchIds: string[]): Promise<void>;
    /**
     * Get all products for a specific branch
     */
    static getBranchProducts(branchId: string): Promise<any[]>;
    /**
     * Get all categories for a specific branch
     */
    static getBranchCategories(branchId: string): Promise<any[]>;
}
//# sourceMappingURL=branch-products.service.d.ts.map