const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { issueLoginCaptcha, verifyLoginCaptcha } = require("../utils/loginCaptcha");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ADMIN_ROLES = ["admin", "owner", "superadmin"];


// 🔐 GENERATE TOKEN (helper)
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: String(user._id),
      role: user.role,
      // include cafeId for multi-tenant routing (falls back to legacy restaurantId)
      cafeId: user.cafeId || user.restaurantId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const serializeUser = (user, restaurant = null) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status || "active",
  avatar: user.avatar || "",
  cafeId: user.cafeId || restaurant?._id || user.restaurantId || null,
  restaurantId: user.restaurantId || restaurant?._id || null,
  cafePublicId: restaurant?.publicRestaurantId || null,
  restaurantPublicId: restaurant?.publicRestaurantId || null,
  cafeName: restaurant?.brandName || "",
  restaurantName: restaurant?.brandName || "",
  cafeLogo: restaurant?.logoUrl || "",
  restaurantLogo: restaurant?.logoUrl || "",
});


// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, cafeId } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (default role = user)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      cafeId: cafeId || null,
      status: "active",
      authProvider: "local",
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cafeId: user.cafeId,
        status: user.status,
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended. Please contact the platform administrator." });
    }

    // Compare password
    if (!user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const restaurant = user.restaurantId ? await Restaurant.findById(user.restaurantId) : null;
    const token = generateToken(user);

    // Send response
    res.json({
      token,
      user: serializeUser(user, restaurant)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GOOGLE CUSTOMER LOGIN =================
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google OAuth is not configured" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ message: "Invalid Google account" });
    }

    let user = await User.findOne({ email: payload.email });

    if (ADMIN_ROLES.includes(user?.role)) {
      return res.status(403).json({ message: "Use cafe admin login for this account" });
    }

    if (user?.status === "suspended") {
      return res.status(403).json({ message: "Account suspended. Please contact the platform administrator." });
    }

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture || "",
        role: "user",
        status: "active",
        authProvider: "google",
      });
    } else {
      user.googleId = user.googleId || payload.sub;
      user.name = user.name || payload.name || payload.email.split("@")[0];
      user.avatar = payload.picture || user.avatar || "";
      user.authProvider = "google";
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Google login failed" });
  }
};

const loginWithRoles = async (req, res, allowedRoles) => {
  try {
    const { email, password, captchaId, captchaAnswer } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!verifyLoginCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ message: "Captcha verification failed. Please try again." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended. Please contact the platform administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch || !allowedRoles.includes(user.role)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const restaurant = user.restaurantId ? await Restaurant.findById(user.restaurantId) : null;
    const token = generateToken(user);

    return res.json({
      token,
      user: serializeUser(user, restaurant),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const loginOwner = async (req, res) => loginWithRoles(req, res, ADMIN_ROLES);
const loginSuperadmin = async (req, res) => loginWithRoles(req, res, ["superadmin"]);
const getLoginCaptcha = (req, res) => {
  res.json(issueLoginCaptcha());
};


module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  loginOwner,
  loginSuperadmin,
  getLoginCaptcha,
};
