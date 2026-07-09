import { Request, Response, NextFunction } from "express";

/**
 * Blocks access when NODE_ENV is production.
 * Used for debug/test routes that must not be exposed publicly.
 */
export function developmentOnly(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({
      success: false,
      message: "Not found",
    });
    return;
  }
  next();
}
