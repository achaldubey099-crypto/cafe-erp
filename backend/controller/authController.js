const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// 🔐 GENERATE TOKEN (helper)
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      restaurantId: user.restaurantId || null,
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
  avatar: user.avatar || "",
  restaurantId: restaurant?._id || user.restaurantId || null,
  restaurantPublicId: restaurant?.publicRestaurantId || null,
  restaurantName: restaurant?.brandName || "",
  restaurantLogo: restaurant?.logoUrl || "",
});


// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
      role: "user",
      authProvider: "local"
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id
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

    if (["owner", "superadmin"].includes(user?.role)) {
      return res.status(403).json({ message: "Use cafe owner login for this account" });
    }

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture || "",
        role: "user",
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
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

const loginOwner = async (req, res) => loginWithRoles(req, res, ["owner", "superadmin"]);
const loginSuperadmin = async (req, res) => loginWithRoles(req, res, ["superadmin"]);


module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  loginOwner,
  loginSuperadmin,
};
