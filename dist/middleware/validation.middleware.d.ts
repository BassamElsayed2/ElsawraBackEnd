import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export declare function validateBody(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function validateQuery(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function validateParams(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function sanitizeMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=validation.middleware.d.ts.map