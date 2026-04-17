const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ADMIN_ROLES = ["admin", "owner", "superadmin"];

// 🔐 COMMON TOKEN VERIFIER (internal use)
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
};

const attachVerifiedUser = async (decoded) => {
  if (!decoded) {
    return null;
  }

  const userId = decoded.userId || decoded.id || null;
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId, "role cafeId restaurantId status").lean();
  if (!user || user.status === "suspended") {
    return null;
  }

  return {
    ...decoded,
    id: String(user._id),
    userId: String(user._id),
    role: user.role,
    cafeId: user.cafeId || user.restaurantId || null,
    restaurantId: user.restaurantId || null,
    status: user.status || "active",
  };
};


// 🔐 CHECK AUTH - attach userId, cafeId, role to request
const checkAuth = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);

    if (!decoded) {
      return res.status(401).json({ message: "No token provided or token invalid" });
    }

    const verifiedUser = await attachVerifiedUser(decoded);
    if (!verifiedUser) {
      return res.status(401).json({ message: "Account is no longer authorized" });
    }

    req.user = verifiedUser;
    req.userId = verifiedUser.userId || null;
    req.role = verifiedUser.role || null;
    req.cafeId = verifiedUser.cafeId || null;

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 🔐 PROTECT (any logged-in user) - alias to checkAuth
const protect = (req, res, next) => checkAuth(req, res, next);

// 🔓 OPTIONAL PROTECT (attach user if token exists, but do not require it)
const optionalProtect = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    const verifiedUser = await attachVerifiedUser(decoded);
    req.user = verifiedUser || null;
    req.userId = verifiedUser?.userId || null;
    req.role = verifiedUser?.role || null;
    req.cafeId = verifiedUser?.cafeId || null;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// 👑 ADMIN PROTECT (only admin allowed)
const protectAdmin = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);

    if (!decoded) {
      return res.status(401).json({ message: "Not authorized, invalid or missing token" });
    }

    const verifiedUser = await attachVerifiedUser(decoded);
    if (!verifiedUser) {
      return res.status(401).json({ message: "Account is no longer authorized" });
    }

    if (!ADMIN_ROLES.includes(verifiedUser.role)) {
      return res.status(403).json({ message: "Access denied, admin, owner or superadmin only" });
    }

    req.user = verifiedUser;
    req.userId = verifiedUser.userId || null;
    req.role = verifiedUser.role || null;
    req.cafeId = verifiedUser.cafeId || null;

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { checkAuth, protect, optionalProtect, protectAdmin, ADMIN_ROLES };
