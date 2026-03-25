"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadsDir = getUploadsDir;
exports.ensureUploadsRootExists = ensureUploadsRootExists;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Absolute path where files are stored on disk (folder served at /uploads).
 * Default: {cwd}/uploads. Set UPLOADS_DIR (or legacy UPLOAD_DIR) to override,
 * e.g. absolute path for a mounted volume.
 */
function getUploadsDir() {
    const raw = process.env.UPLOADS_DIR || process.env.UPLOAD_DIR;
    if (raw) {
        return path_1.default.isAbsolute(raw) ? raw : path_1.default.join(process.cwd(), raw);
    }
    return path_1.default.join(process.cwd(), "uploads");
}
async function ensureUploadsRootExists() {
    await promises_1.default.mkdir(getUploadsDir(), { recursive: true });
}
//# sourceMappingURL=uploads.js.map