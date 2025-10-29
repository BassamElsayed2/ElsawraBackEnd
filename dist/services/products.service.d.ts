export interface ProductFilters {
    category_id?: string;
    search?: string;
    is_active?: boolean;
    branch_id?: string;
}
export declare class ProductsService {
    static getProducts(page?: number, limit?: number, filters?: ProductFilters): Promise<{
        products: import("mssql").IRecordSet<any>;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getProductById(id: string): Promise<any>;
    static createProduct(data: any): Promise<any>;
    static updateProduct(id: string, data: any): Promise<any>;
    static deleteProduct(id: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=products.service.d.ts.map