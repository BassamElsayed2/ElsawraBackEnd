import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
export type AccountType = "dashboard" | "customer";
export interface AdminContext {
    role: string;
    permissions: string[];
}
export declare function hasPermission(context: AdminContext, required: string | string[]): boolean;
export declare function customerAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function dashboardAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/** @deprecated Use customerAuthMiddleware or dashboardAuthMiddleware */
export declare const authMiddleware: typeof customerAuthMiddleware;
export declare function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requirePermission(...permissions: string[]): (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare function requireSuperAdmin(): (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map