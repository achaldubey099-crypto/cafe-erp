const express = require("express");
const { loginUser, registerUser, googleLogin } = require("../controller/authController");

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/google", googleLogin);

module.exports = router;
