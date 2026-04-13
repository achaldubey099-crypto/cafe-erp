const adminOnly = (req, res, next) => {
  // Check if user exists (from protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Check role
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

module.exports = { adminOnly };