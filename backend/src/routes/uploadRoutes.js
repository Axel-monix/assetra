const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/authMiddleware");
const { success, error } = require("../../constants/response");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, "asset-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
    cb(null, true);
  }
});

router.post("/", authenticateToken, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return error(res, {
        message: err.message || "Gagal upload gambar",
        statusCode: err.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      });
    }

    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return error(res, { message: "Tidak ada file yang diupload", statusCode: 400 });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    
    return success(res, {
      message: "Gambar berhasil diupload",
      data: { url: imageUrl }
    });
  } catch (err) {
    console.error("Upload error:", err);
    return error(res, { message: err.message || "Gagal upload gambar" });
  }
});

module.exports = router;