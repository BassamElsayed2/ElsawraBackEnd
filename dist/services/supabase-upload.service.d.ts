export declare const BUCKETS: {
    readonly PRODUCT_IMAGES: "product-images";
    readonly COMBO_OFFERS_MEDIA: "combooffersmedia";
    readonly AVATARS: "avatars";
    readonly BRANCHES: "branches";
    readonly QR_IMAGES: "QrImages";
};
export type BucketName = keyof typeof BUCKETS;
export declare class SupabaseUploadService {
    /**
     * Upload file to Supabase Storage
     */
    static uploadFile(file: Express.Multer.File, bucket: string, folder?: string): Promise<{
        url: string;
        path: string;
    }>;
    /**
     * Upload buffer to Supabase Storage (useful for generated images like QR codes)
     */
    static uploadBuffer(buffer: Buffer, filename: string, bucket: string, folder?: string, contentType?: string): Promise<{
        url: string;
        path: string;
    }>;
    /**
     * Delete file from Supabase Storage
     */
    static deleteFile(bucket: string, path: string): Promise<void>;
    /**
     * Check if bucket exists
     */
    static bucketExists(bucket: string): Promise<boolean>;
    /**
     * Create bucket if it doesn't exist
     */
    static createBucket(bucket: string): Promise<void>;
}
//# sourceMappingURL=supabase-upload.service.d.ts.map