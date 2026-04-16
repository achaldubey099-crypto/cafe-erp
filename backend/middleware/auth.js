const jwt = require("jsonwebtoken");

const ADMIN_ROLES = ["owner", "superadmin"];

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


// 🔐 PROTECT (any logged-in user)
const protect = (req, res, next) => {
  const decoded = verifyToken(req);

  if (!decoded) {
    return res.status(401).json({ message: "Not authorized, invalid or missing token" });
  }

  req.user = decoded;
  next();
};

// 🔓 OPTIONAL PROTECT (attach user if token exists, but do not require it)
const optionalProtect = (req, res, next) => {
  const decoded = verifyToken(req);
  req.user = decoded || null;
  next();
};


// 👑 ADMIN PROTECT (only admin allowed)
const protectAdmin = (req, res, next) => {
  const decoded = verifyToken(req);

  if (!decoded) {
    return res.status(401).json({ message: "Not authorized, invalid or missing token" });
  }

  if (!ADMIN_ROLES.includes(decoded.role)) {
    return res.status(403).json({ message: "Access denied, owner or superadmin only" });
  }

  req.user = decoded;
  next();
};

module.exports = { protect, optionalProtect, protectAdmin, ADMIN_ROLES };
