const express = require("express");
const router = express.Router();

const { getApiStatus } = require("../controllers/indexController");
const { getUsers } = require("../controllers/userController");

router.get("/api", getApiStatus);

router.get("/users", getUsers);

module.exports = router;
