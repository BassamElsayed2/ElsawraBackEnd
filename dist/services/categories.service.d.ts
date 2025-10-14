export interface CategoryFilters {
    search?: string;
    is_active?: boolean;
}
export declare class CategoriesService {
    static getCategories(filters?: CategoryFilters): Promise<import("mssql").IRecordSet<any>>;
    static getCategoryById(id: string): Promise<any>;
    static createCategory(data: any): Promise<any>;
    static updateCategory(id: string, data: any): Promise<any>;
    static deleteCategory(id: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=categories.service.d.ts.map