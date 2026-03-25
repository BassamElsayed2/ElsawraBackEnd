import fs from "fs/promises";
import path from "path";

/**
 * Absolute path where files are stored on disk (folder served at /uploads).
 * Default: {cwd}/uploads. Set UPLOADS_DIR (or legacy UPLOAD_DIR) to override,
 * e.g. absolute path for a mounted volume.
 */
export function getUploadsDir(): string {
  const raw = process.env.UPLOADS_DIR || process.env.UPLOAD_DIR;
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  }
  return path.join(process.cwd(), "uploads");
}

export async function ensureUploadsRootExists(): Promise<void> {
  await fs.mkdir(getUploadsDir(), { recursive: true });
}
