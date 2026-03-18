import fs from "fs";
import path from "path";

import multer from "multer";

import { HttpError } from "../lib/httpError";

const publicDir = path.resolve(process.cwd(), "public");
const listingUploadDir = path.join(publicDir, "uploads", "listings");

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const ensureUploadDirectory = () => {
  fs.mkdirSync(listingUploadDir, { recursive: true });
};

ensureUploadDirectory();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadDirectory();
    callback(null, listingUploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}${extension}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new HttpError(400, "Only JPG, PNG, and WEBP images are allowed."));
};

export const listingImagesUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 4,
  },
});
