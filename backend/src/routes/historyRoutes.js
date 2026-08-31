const express = require("express");
const router = express.Router();

const {
  listHistory,
  exportHistory,
} = require("../controllers/historyController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, listHistory);
router.get("/export", authenticateToken, exportHistory);

module.exports = router;
