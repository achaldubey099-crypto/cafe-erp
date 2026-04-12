const jwt = require("jsonwebtoken");

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


// 👑 ADMIN PROTECT (only admin allowed)
const protectAdmin = (req, res, next) => {
  const decoded = verifyToken(req);

  if (!decoded) {
    return res.status(401).json({ message: "Not authorized, invalid or missing token" });
  }

  if (decoded.role !== "admin") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }

  req.user = decoded;
  next();
};


module.exports = { protect, protectAdmin };