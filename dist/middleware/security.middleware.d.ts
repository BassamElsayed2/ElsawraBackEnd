import { Request, Response, NextFunction } from "express";
export declare function logSecurityEvent(eventType: string, req: Request, userId?: string, email?: string, details?: any): Promise<void>;
export declare function suspiciousActivityDetector(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
export declare function csrfProtection(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function securityHeaders(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=security.middleware.d.ts.map