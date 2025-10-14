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