export declare const OTP_CONFIG: {
    enabled: boolean;
    length: number;
    expiryMinutes: number;
    maxAttempts: number;
    resendCooldown: number;
};
export declare function generateOTP(length?: number): string;
export declare function sendOTPviaSMS(phone: string, code: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export declare function verifyOTPviaSMS(phone: string, code: string): Promise<{
    success: boolean;
    error?: string;
}>;
//# sourceMappingURL=otp.d.ts.map