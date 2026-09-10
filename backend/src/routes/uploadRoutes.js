const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { authenticateToken } = require("../middleware/authMiddleware");
const { success, error } = require("../../constants/response");
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan"), false);
    }
    cb(null, true);
  },
});

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "assetra" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

router.post(
  "/",
  authenticateToken,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return error(res, {
          messageKey: err.code === "LIMIT_FILE_SIZE" ? "fileTooLarge" : "invalidFileType",
          message: err.message || "Gagal upload gambar",
          statusCode: err.code === "LIMIT_FILE_SIZE" ? 413 : 400,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return error(res, {
          messageKey: "noFileUploaded",
          message: "Tidak ada file yang diupload",
          statusCode: 400,
        });
      }

      const result = await uploadBufferToCloudinary(req.file.buffer);

      return success(res, {
        messageKey: "uploadSuccess",
        message: "Gambar berhasil diupload",
        data: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      });
    } catch (err) {
      console.error("Upload error:", err);
      return error(res, {
        messageKey: "uploadFailed",
        message: err.message || "Gagal upload gambar",
      });
    }
  },
);
module.exports = router;