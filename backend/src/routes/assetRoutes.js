const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { listAssets } = require("../controllers/assetController");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listAssets);

module.exports = router;
