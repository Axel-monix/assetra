const express = require("express");
const router = express.Router();

const { getApiStatus } = require("../controllers/indexController");
const { getUsers } = require("../controllers/userController");

const authRoutes = require("./authRoutes");

router.get("/", getApiStatus);

router.get("/users", getUsers);

router.use("/auth", authRoutes);

module.exports = router;
