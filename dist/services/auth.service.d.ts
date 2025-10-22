import { Request } from "express";
interface SignUpData {
    email: string;
    password: string;
    full_name: string;
    phone: string;
}
interface SignInData {
    email: string;
    password: string;
}
export declare class AuthService {
    static signUp(data: SignUpData, req: Request): Promise<{
        user: {
            id: any;
            email: any;
            full_name: string;
            phone: string;
        };
    }>;
    static signIn(data: SignInData, req: Request): Promise<{
        user: {
            id: any;
            email: any;
            full_name: any;
            phone: any;
            email_verified: any;
            phone_verified: any;
            role: any;
        };
        token: string;
    }>;
    static signOut(userId: string, token: string, req: Request): Promise<{
        success: boolean;
    }>;
    static getCurrentUser(userId: string): Promise<any>;
    static updateProfile(userId: string, data: {
        full_name?: string;
        phone?: string;
    }): Promise<{
        success: boolean;
    }>;
    static changePassword(userId: string, oldPassword: string, newPassword: string, req: Request): Promise<{
        success: boolean;
    }>;
    static checkPhoneExists(phone: string): Promise<boolean>;
    static googleSignIn(idToken: string, req: Request): Promise<{
        user: {
            id: any;
            email: any;
            full_name: any;
            phone: any;
            email_verified: any;
            phone_verified: any;
            role: any;
        };
        token: string;
        isNewUser: boolean;
    }>;
    static facebookSignIn(accessToken: string, req: Request): Promise<{
        user: {
            id: any;
            email: any;
            full_name: any;
            phone: any;
            email_verified: any;
            phone_verified: any;
            role: any;
        };
        token: string;
        isNewUser: boolean;
    }>;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map