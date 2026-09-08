const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware"); 
const { requireSuperAdmin } = require("../middleware/requireSuperAdmin");
const { listAdmins, createAdmin, toggleAdminStatus } = require("../controllers/adminController");

router.use(authenticateToken, requireSuperAdmin);

router.get("/", listAdmins);
router.post("/", createAdmin);
router.patch("/:id/status", toggleAdminStatus);

module.exports = router;