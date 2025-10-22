import { Response, NextFunction } from "express";
export declare class PaymentController {
    /**
     * Initiate payment
     */
    static initiatePayment: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Handle EasyKash callback
     */
    static handleEasyKashCallback: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get payment status
     */
    static getPaymentStatus: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get payment by order ID
     */
    static getPaymentByOrderId: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Cancel payment
     */
    static cancelPayment: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Get all payments (admin)
     */
    static getAllPayments: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Test EasyKash signature verification
     */
    static testSignature: (req: import("express").Request, res: Response, next: NextFunction) => void;
    /**
     * Test new EasyKash callback format
     */
    static testNewFormat: (req: import("express").Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=payment.controller.d.ts.map