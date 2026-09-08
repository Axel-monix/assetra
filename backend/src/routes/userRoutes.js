const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  updateOwnName,
  requestEmailChange,
  verifyEmailChange,
} = require("../controllers/userController");
router.patch("/me", authenticateToken, updateOwnName);
router.post("/me/email-change/request", authenticateToken, requestEmailChange);
router.post("/me/email-change/verify", authenticateToken, verifyEmailChange);

module.exports = router;