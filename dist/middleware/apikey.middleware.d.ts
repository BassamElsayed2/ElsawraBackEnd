import { Request, Response, NextFunction, RequestHandler } from "express";
/**
 * Rate limit for routes protected by x-api-key.
 * Keyed by IP (token in header changes with timestamp, so it cannot be the bucket key).
 */
export declare const apiKeyRateLimiter: RequestHandler;
/**
 * Use this array on routes: `router.use(...apiKeyRouteMiddleware)`
 * Order: rate limit first, then decrypt/validate key.
 */
export declare const apiKeyRouteMiddleware: RequestHandler[];
/**
 * Middleware to decrypt x-api-key header if present
 * Decrypts the API key using ENCRYPTION_KEY from environment variables
 * Logs the decrypted data for debugging
 */
export declare function decryptApiKey(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=apikey.middleware.d.ts.map