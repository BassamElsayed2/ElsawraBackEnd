import { Response, NextFunction } from "express";
export declare class OrdersController {
    static getUserOrders: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getOrderById: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static createOrder: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static cancelOrder: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static updateOrderStatus: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static markOrderAsPaid: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getAllOrders: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static debugOrdersByStatus: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getOrderByIdAdmin: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static getOrderStats: (req: import("express").Request, res: Response, next: NextFunction) => void;
    static deleteOrder: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=orders.controller.d.ts.map