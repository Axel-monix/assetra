const express = require("express");
const router = express.Router();

const { getApiStatus } = require("../controllers/indexController");
const { getUsers } = require("../controllers/userController");

const authRoutes = require("./authRoutes");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/", getApiStatus);

router.get("/users", getUsers);

router.use("/auth", authRoutes);

// TEST AUTHENTICATION
router.get("/test-auth", authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication successful",
    data: {
      user: req.user,
    },
  });
});

module.exports = router;
