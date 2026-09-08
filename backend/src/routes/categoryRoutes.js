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
router.get("/", listCategories);
router.get("/:id", getCategoryById);
router.post("/", authorizeRoles("admin", "super_admin"), createCategory);
router.patch("/:id", authorizeRoles("admin", "super_admin"), updateCategory);
router.delete("/:id", authorizeRoles("admin", "super_admin"), deleteCategory);
module.exports = router;