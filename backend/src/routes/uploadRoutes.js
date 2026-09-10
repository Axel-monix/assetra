const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const { authenticateToken } = require("../middleware/authMiddleware");
const { success, error } = require("../../constants/response");
const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "assetra",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan"), false);
    }
    cb(null, true);
  },
});

router.post(
  "/",
  authenticateToken,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return error(res, {
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
          message: "Tidak ada file yang diupload",
          statusCode: 400,
        });
      }

      // req.file.path = full Cloudinary URL, req.file.filename = public_id
      return success(res, {
        message: "Gambar berhasil diupload",
        data: {
          url: req.file.path,
          public_id: req.file.filename,
        },
      });
    } catch (err) {
      console.error("Upload error:", err);
      return error(res, { message: err.message || "Gagal upload gambar" });
    }
  },
);

module.exports = router;