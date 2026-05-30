import multer from "multer";

function isImage(mimetype: string): boolean {
  return mimetype.startsWith("image/");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "photo") {
      if (!isImage(file.mimetype)) {
        cb(new Error("photo must be an image"));
        return;
      }
      cb(null, true);
      return;
    }

    if (file.fieldname === "proofOfOwnership") {
      const allowed =
        isImage(file.mimetype) || file.mimetype === "application/pdf";
      if (!allowed) {
        cb(new Error("proof of ownership must be an image or PDF"));
        return;
      }
      cb(null, true);
      return;
    }

    cb(new Error(`Unexpected field: ${file.fieldname}`));
  },
});

export const uploadStallFiles = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "proofOfOwnership", maxCount: 1 },
]);
