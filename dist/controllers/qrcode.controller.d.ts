import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
export declare const qrcodeController: {
    generateQRCode: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    getQRCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAllQRCodes: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteQRCode: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
};
//# sourceMappingURL=qrcode.controller.d.ts.map