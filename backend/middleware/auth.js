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


// 🔐 CHECK AUTH - attach userId, cafeId, role to request
const checkAuth = (req, res, next) => {
  const decoded = verifyToken(req);

  if (!decoded) {
    return res.status(401).json({ message: "No token provided or token invalid" });
  }

  // normalized fields
  req.user = decoded;
  req.userId = decoded.userId || decoded.id || null;
  req.role = decoded.role || null;
  req.cafeId = decoded.cafeId || decoded.restaurantId || null;

  next();
};

// 🔐 PROTECT (any logged-in user) - alias to checkAuth
const protect = (req, res, next) => checkAuth(req, res, next);

// 🔓 OPTIONAL PROTECT (attach user if token exists, but do not require it)
const optionalProtect = (req, res, next) => {
  const decoded = verifyToken(req);
  req.user = decoded || null;
  req.userId = decoded?.userId || decoded?.id || null;
  req.role = decoded?.role || null;
  req.cafeId = decoded?.cafeId || decoded?.restaurantId || null;
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

  // attach normalized fields
  req.user = decoded;
  req.userId = decoded.userId || decoded.id || null;
  req.role = decoded.role || null;
  req.cafeId = decoded.cafeId || decoded.restaurantId || null;

  next();
};

module.exports = { checkAuth, protect, optionalProtect, protectAdmin, ADMIN_ROLES };
