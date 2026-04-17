const express = require("express");
const { protect } = require("../middleware/auth");
const {
  listRestaurants,
  createRestaurantWithOwner,
  updateRestaurantOwner,
  listCafes,
  updateCafe,
  createCafe,
  listAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
  setRestaurantOwnerStatus,
  deleteRestaurantOwnerCredentials,
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
router.patch("/restaurants/:id/owner/status", setRestaurantOwnerStatus);
router.delete("/restaurants/:id/owner", deleteRestaurantOwnerCredentials);
router.get("/admins", listAdminAccounts);
router.post("/admins", createAdminAccount);
router.delete("/admins/:id", deleteAdminAccount);

// Cafe multi-tenant endpoints
router.get('/cafes', listCafes);
router.post('/cafes', createCafe);
router.patch('/cafes/:id', updateCafe);

module.exports = router;
