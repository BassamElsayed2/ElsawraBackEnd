import { Response, NextFunction } from "express";
export declare class AuthController {
    static signUp: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static signIn: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static signOut: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getMe: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static updateProfile: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static changePassword: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static checkPhoneExists: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static googleSignIn: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=auth.controller.d.ts.map