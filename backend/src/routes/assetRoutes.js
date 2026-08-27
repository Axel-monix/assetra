const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  listAssets,
  createAsset,
  updateAsset,
  deactivateAssets,
} = require("../controllers/assetController");

const router = express.Router();
router.use((req, res, next) => {
  console.log( req.method, req.originalUrl);
  next();
});

router.use(authenticateToken);
router.get("/", listAssets);
router.post("/", createAsset);
router.patch("/deactivate", deactivateAssets);
router.patch("/:id", updateAsset);

module.exports = router;
