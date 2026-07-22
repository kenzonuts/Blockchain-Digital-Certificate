import fs from "fs";
import path from "path";

export const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
export const TEMPLATE_UPLOAD_DIR = path.join(UPLOAD_ROOT, "templates");

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function ensureUploadDirs() {
  fs.mkdirSync(TEMPLATE_UPLOAD_DIR, { recursive: true });
}

export function isAllowedImage(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function toPublicUploadPath(absoluteOrRelative: string): string {
  const relative = absoluteOrRelative.includes("uploads")
    ? absoluteOrRelative.split(`uploads${path.sep}`).pop() ??
      absoluteOrRelative
    : absoluteOrRelative;
  return `/uploads/${relative.replace(/\\/g, "/")}`;
}

export function absoluteFromPublicPath(publicPath: string): string {
  const cleaned = publicPath.replace(/^\/uploads\//, "");
  return path.join(UPLOAD_ROOT, cleaned);
}

export function safeUnlink(publicPath?: string | null) {
  if (!publicPath) return;
  try {
    const abs = absoluteFromPublicPath(publicPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    // ignore cleanup errors
  }
}
