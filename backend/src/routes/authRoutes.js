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


router.post("/login", login);

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