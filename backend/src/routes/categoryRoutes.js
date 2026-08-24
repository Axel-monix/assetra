const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { listCategories } = require("../controllers/categoryController");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listCategories);

module.exports = router;