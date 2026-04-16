const adminOnly = (req, res, next) => {
  // Check if user exists (from protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Check role
  if (!["owner", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Owner or superadmin access only" });
  }

  next();
};

module.exports = { adminOnly };
