import { Request, Response, NextFunction } from "express";
/**
 * Middleware to decrypt x-api-key header if present
 * Decrypts the API key using ENCRYPTION_KEY from environment variables
 * Logs the decrypted data for debugging
 */
export declare function decryptApiKey(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=apikey.middleware.d.ts.map