import { Response, NextFunction } from "express";
export declare class CleanupController {
    /**
     * Clean up expired pending orders (admin only)
     */
    static cleanupExpiredPendingOrders: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get cleanup statistics (admin only)
     */
    static getCleanupStats: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=cleanup.controller.d.ts.map