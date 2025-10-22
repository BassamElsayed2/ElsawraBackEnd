export interface FacebookUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: {
        data: {
            url: string;
        };
    };
}
export declare class FacebookAuthService {
    /**
     * Verify Facebook access token and get user information
     */
    static verifyAccessToken(accessToken: string): Promise<FacebookUserInfo>;
}
//# sourceMappingURL=facebook-auth.service.d.ts.map