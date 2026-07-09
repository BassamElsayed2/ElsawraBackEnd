import { Response, NextFunction } from "express";
export declare class AdminController {
    static getAdminProfile: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static updateAdminProfile: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getAllAdmins: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getAllUsers: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getUsersTotals: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getDashboardStats: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static checkPhoneForNewAdmin: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static createAdmin: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=admin.controller.d.ts.map