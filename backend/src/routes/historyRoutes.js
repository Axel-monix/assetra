const express = require("express");
const router = express.Router();

const { listHistory } = require("../controllers/historyController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, listHistory);

module.exports = router;