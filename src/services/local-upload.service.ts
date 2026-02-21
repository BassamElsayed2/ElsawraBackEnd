import fs from "fs/promises";
import path from "path";
import { logger } from "../utils/logger";

// Base uploads directory (relative to backend root)
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Bucket configurations (same keys as Supabase for compatibility)
export const BUCKETS = {
  PRODUCT_IMAGES: "product-images",
  COMBO_OFFERS_MEDIA: "combooffersmedia",
  AVATARS: "avatars",
  BRANCHES: "branches",
  QR_IMAGES: "QrImages",
} as const;

export type BucketName = keyof typeof BUCKETS;

function getBaseUrl(): string {
  return process.env.API_URL || "http://localhost:" + (process.env.PORT || "3000");
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export class LocalUploadService {
  /**
   * Upload file to local uploads folder
   */
  static async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    folder?: string
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
    const filename = `${timestamp}-${randomSuffix}.${ext}`;

    const relativePath = folder ? `${bucket}/${folder}/${filename}` : `${bucket}/${filename}`;
    const absolutePath = path.join(UPLOADS_DIR, relativePath);

    await ensureDir(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, file.buffer);

    const url = `${getBaseUrl()}/uploads/${relativePath}`;
    logger.info(`File uploaded locally: ${relativePath} in bucket: ${bucket}`);

    return { url, path: relativePath };
  }

  /**
   * Upload buffer to local uploads folder (e.g. QR codes)
   */
  static async uploadBuffer(
    buffer: Buffer,
    filename: string,
    bucket: string,
    folder?: string,
    _contentType: string = "image/png"
  ): Promise<{ url: string; path: string }> {
    const relativePath = folder ? `${bucket}/${folder}/${filename}` : `${bucket}/${filename}`;
    const absolutePath = path.join(UPLOADS_DIR, relativePath);

    await ensureDir(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, buffer);

    const url = `${getBaseUrl()}/uploads/${relativePath}`;
    logger.info(`Buffer uploaded locally: ${relativePath} to bucket: ${bucket}`);

    return { url, path: relativePath };
  }

  /**
   * Delete file from local uploads folder
   */
  static async deleteFile(bucket: string, filePath: string): Promise<void> {
    // filePath can be "bucket/sub/filename" or "filename" (legacy)
    const relativePath = filePath.includes("/") ? filePath : `${bucket}/${filePath}`;
    const absolutePath = path.join(UPLOADS_DIR, relativePath);

    try {
      await fs.access(absolutePath);
      await fs.unlink(absolutePath);
      logger.info(`File deleted locally: ${relativePath} from bucket: ${bucket}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
        logger.warn(`File not found for delete: ${absolutePath}`);
        return;
      }
      logger.error("Local delete error:", err);
      throw new Error(`Failed to delete file: ${message}`);
    }
  }

  /**
   * Ensure bucket directory exists (no-op for local)
   */
  static async createBucket(bucket: string): Promise<void> {
    const bucketPath = path.join(UPLOADS_DIR, bucket);
    await ensureDir(bucketPath);
    logger.info(`Bucket directory ready: ${bucket}`);
  }

  /**
   * Check if bucket directory exists
   */
  static async bucketExists(bucket: string): Promise<boolean> {
    const bucketPath = path.join(UPLOADS_DIR, bucket);
    try {
      const stat = await fs.stat(bucketPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
