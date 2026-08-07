import fs from "fs/promises";
import path from "path";

/**
 * Disk root for uploaded files (= backend/uploads when the app cwd is backend/).
 *
 * Local:   <repo>/backend/uploads/
 * Docker/Coolify: /app/uploads  (same folder; mount Persistent Storage here)
 *
 * Override with UPLOADS_DIR / UPLOAD_DIR only when mounting an external volume.
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
