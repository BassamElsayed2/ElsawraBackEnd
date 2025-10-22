export declare class CleanupService {
    /**
     * Clean up expired pending orders
     */
    static cleanupExpiredPendingOrders(): Promise<{
        success: boolean;
        deletedCount: any;
        timestamp: string;
    }>;
    /**
     * Get cleanup statistics
     */
    static getCleanupStats(): Promise<{
        totalPendingOrders: any;
        expiredCount: any;
        activeCount: any;
        timestamp: string;
    }>;
}
//# sourceMappingURL=cleanup.service.d.ts.map