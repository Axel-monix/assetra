const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { listAssets, createAsset } = require("../controllers/assetController");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listAssets);
router.post("/",createAsset);

module.exports = router;