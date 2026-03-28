export type SessionCookieOptions = {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    maxAge: number;
};
export declare function getSessionCookieOptions(): SessionCookieOptions;
/** Pass to res.clearCookie(name, opts) so the browser actually removes SameSite=None cookies */
export declare function getClearSessionCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    path: string;
};
export declare const AUTH_CONFIG: {
    jwt: {
        secret: string;
        expiresIn: string;
    };
    session: {
        expiresIn: number;
        cookieName: string;
        useSecureCookies: boolean;
    };
    password: {
        minLength: number;
        maxLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        bcryptRounds: number;
    };
    accountLockout: {
        maxAttempts: number;
        lockoutDuration: number;
    };
    passwordHistory: {
        count: number;
    };
};
//# sourceMappingURL=auth.d.ts.map