import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
export declare class AddressesController {
    static getUserAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static createAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static updateAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static deleteAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=addresses.controller.d.ts.map