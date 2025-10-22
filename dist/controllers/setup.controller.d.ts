import { Response, NextFunction } from "express";
export declare class SetupController {
    /**
     * Setup pending orders system (admin only)
     */
    static setupPendingOrders: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Check system status
     */
    static checkSystemStatus: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=setup.controller.d.ts.map