export declare const BUCKETS: {
    readonly PRODUCT_IMAGES: "product-images";
    readonly COMBO_OFFERS_MEDIA: "combooffersmedia";
    readonly AVATARS: "avatars";
    readonly BRANCHES: "branches";
    readonly QR_IMAGES: "QrImages";
};
export type BucketName = keyof typeof BUCKETS;
export declare class LocalUploadService {
    /**
     * Upload file to local uploads folder
     */
    static uploadFile(file: Express.Multer.File, bucket: string, folder?: string): Promise<{
        url: string;
        path: string;
    }>;
    /**
     * Upload buffer to local uploads folder (e.g. QR codes)
     */
    static uploadBuffer(buffer: Buffer, filename: string, bucket: string, folder?: string, _contentType?: string): Promise<{
        url: string;
        path: string;
    }>;
    /**
     * Delete file from local uploads folder
     */
    static deleteFile(bucket: string, filePath: string): Promise<void>;
    /**
     * Ensure bucket directory exists (no-op for local)
     */
    static createBucket(bucket: string): Promise<void>;
    /**
     * Check if bucket directory exists
     */
    static bucketExists(bucket: string): Promise<boolean>;
}
//# sourceMappingURL=local-upload.service.d.ts.map