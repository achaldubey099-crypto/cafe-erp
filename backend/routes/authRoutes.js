const express = require("express");
const {
  loginUser,
  registerUser,
  googleLogin,
  loginOwner,
  loginSuperadmin,
  getLoginCaptcha,
} = require("../controller/authController");

const router = express.Router();

router.post("/login", loginUser);
router.get("/captcha", getLoginCaptcha);
router.post("/admin/login", loginOwner);
router.post("/superadmin/login", loginSuperadmin);
router.post("/register", registerUser);
router.post("/google", googleLogin);

module.exports = router;
