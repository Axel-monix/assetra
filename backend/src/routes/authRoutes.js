const express = require("express");
const router = express.Router();
const {
  login,
  getMe,
} = require("../controllers/authController");
const {
  authenticateToken,
} = require("../middleware/authMiddleware");
const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");
const {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require("../controllers/forgotPasswordController");
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/forgot-password/verify", verifyResetCode);
router.post("/forgot-password/reset", resetPassword);
router.get(
  "/me",
  authenticateToken,
  getMe
);
router.get(
  "/superadmin",
  authenticateToken,
  authorizeRoles("super_admin"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Welcome, Super Admin!",
      data: {
        user: req.user,
      },
    });
  }
);

module.exports = router;