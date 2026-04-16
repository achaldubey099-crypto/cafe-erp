const express = require("express");
const { protect } = require("../middleware/auth");
const {
  listRestaurants,
  createRestaurantWithOwner,
  updateRestaurantOwner,
} = require("../controller/superadminController");

const router = express.Router();

const requireSuperadmin = (req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin access only" });
  }
  next();
};

router.use(protect, requireSuperadmin);

router.get("/restaurants", listRestaurants);
router.post("/restaurants", createRestaurantWithOwner);
router.patch("/restaurants/:id", updateRestaurantOwner);

module.exports = router;
