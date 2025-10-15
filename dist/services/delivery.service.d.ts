export interface DeliveryFeeConfig {
    id: string;
    min_distance_km: number;
    max_distance_km: number;
    fee: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CalculateDeliveryFeeParams {
    user_latitude: number;
    user_longitude: number;
    branch_id?: string;
}
export interface CalculateDeliveryFeeResult {
    fee: number;
    distance_km: number;
    nearest_branch: {
        id: string;
        name_ar: string;
        name_en: string;
        address_ar: string;
        address_en: string;
    };
}
export declare class DeliveryService {
    static calculateDeliveryFee(params: CalculateDeliveryFeeParams): Promise<CalculateDeliveryFeeResult>;
    static getDeliveryFeeConfigs(): Promise<DeliveryFeeConfig[]>;
    static createDeliveryFeeConfig(config: {
        min_distance_km: number;
        max_distance_km: number;
        fee: number;
    }): Promise<DeliveryFeeConfig>;
    static updateDeliveryFeeConfig(id: string, config: {
        min_distance_km?: number;
        max_distance_km?: number;
        fee?: number;
        is_active?: boolean;
    }): Promise<DeliveryFeeConfig>;
    static deleteDeliveryFeeConfig(id: string): Promise<void>;
}
//# sourceMappingURL=delivery.service.d.ts.map