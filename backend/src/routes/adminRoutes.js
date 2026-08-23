// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware"); // sesuaikan nama file middleware auth lo
const { requireSuperAdmin } = require("../middleware/requireSuperAdmin");
const { listAdmins, createAdmin, toggleAdminStatus } = require("../controllers/adminController");

// Semua endpoint di sini wajib login DAN wajib super_admin
router.use(authenticateToken, requireSuperAdmin);

router.get("/", listAdmins);
router.post("/", createAdmin);
router.patch("/:id/status", toggleAdminStatus);

module.exports = router;