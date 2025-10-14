import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map