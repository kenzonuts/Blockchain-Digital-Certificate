import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import {
  TEMPLATE_UPLOAD_DIR,
  ensureUploadDirs,
  isAllowedImage,
  MAX_IMAGE_BYTES,
} from "../lib/uploads";

ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, TEMPLATE_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!isAllowedImage(file.mimetype)) {
    cb(new Error("Only PNG, JPEG, or WebP images are allowed"));
    return;
  }
  cb(null, true);
}

export const templateUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter,
});

export const templateFields = templateUpload.fields([
  { name: "backgroundImage", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "stamp", maxCount: 1 },
]);
