const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.use(authenticateToken);

// Read: admin & super_admin (Guest tidak lewat sini — Guest hanya lihat
// info kategori lewat detail item hasil scan QR, bukan endpoint ini).
router.get("/", listCategories);
router.get("/:id", getCategoryById);

// Write: admin & super_admin (RAG section 4.2 — CRUD Category bukan
// hak eksklusif super_admin).
router.post("/", authorizeRoles("admin", "super_admin"), createCategory);
router.patch("/:id", authorizeRoles("admin", "super_admin"), updateCategory);
router.delete("/:id", authorizeRoles("admin", "super_admin"), deleteCategory);

module.exports = router;