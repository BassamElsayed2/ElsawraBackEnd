export interface GoogleUserInfo {
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    sub: string;
}
export declare class GoogleAuthService {
    /**
     * Verify Google ID token and extract user information
     */
    static verifyIdToken(idToken: string): Promise<GoogleUserInfo>;
}
//# sourceMappingURL=google-auth.service.d.ts.map