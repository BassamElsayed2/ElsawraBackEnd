import { Request, Response, NextFunction } from "express";
export declare class DeliveryController {
    private static calculateDistance;
    private static deg2rad;
    static getNearestBranch(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static calculateDeliveryFee(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=delivery.controller.d.ts.map