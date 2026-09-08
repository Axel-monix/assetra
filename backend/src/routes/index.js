const express = require("express");
const router = express.Router();
const { getApiStatus } = require("../controllers/indexController");
const { getUsers } = require("../controllers/userController");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const assetRoutes = require("./assetRoutes");
const categoryRoutes = require("./categoryRoutes");
const historyRoutes = require("./historyRoutes");
router.get("/", getApiStatus);
router.get("/users", getUsers);
router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/assets", assetRoutes);
router.use("/categories", categoryRoutes);
router.use("/history", historyRoutes);

module.exports = router;