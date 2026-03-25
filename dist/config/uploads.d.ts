/**
 * Absolute path where files are stored on disk (folder served at /uploads).
 * Default: {cwd}/uploads. Set UPLOADS_DIR (or legacy UPLOAD_DIR) to override,
 * e.g. absolute path for a mounted volume.
 */
export declare function getUploadsDir(): string;
export declare function ensureUploadsRootExists(): Promise<void>;
//# sourceMappingURL=uploads.d.ts.map