export declare class UploadService {
    static processImage(filePath: string, options?: {
        width?: number;
        height?: number;
        quality?: number;
        format?: "jpeg" | "png" | "webp";
    }): Promise<string>;
    static createThumbnail(filePath: string, width?: number, height?: number): Promise<string>;
    static deleteFile(filePath: string): void;
    static getFileUrl(filePath: string): string;
}
//# sourceMappingURL=upload.service.d.ts.map