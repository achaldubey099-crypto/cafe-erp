const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

const ensureRestaurantForUser = async (req) => {
  // If request has cafeId from JWT, prefer it and resolve linked Restaurant
  if (req.cafeId) {
    const Cafe = require('../models/Cafe');
    const cafe = await Cafe.findById(req.cafeId).lean();
    if (cafe && cafe.restaurantRef) {
      return { restaurantId: cafe.restaurantRef, restaurant: null };
    }

    const linkedOwner = await User.findOne(
      {
        cafeId: req.cafeId,
        role: "owner",
        restaurantId: { $ne: null },
      },
      "restaurantId"
    ).lean();

    if (linkedOwner?.restaurantId) {
      return { restaurantId: linkedOwner.restaurantId, restaurant: null };
    }
  }

  if (["admin", "owner"].includes(req.user?.role) && req.user.restaurantId) {
    return { restaurantId: req.user.restaurantId, restaurant: null };
  }

  if (req.user?.role === "superadmin") {
    const publicId =
      req.query.restaurant ||
      req.query.restaurantId ||
      req.body?.restaurant ||
      req.body?.restaurantId ||
      null;

    if (!publicId) {
      return { restaurantId: null, restaurant: null };
    }

    const restaurant = await Restaurant.findOne({ publicRestaurantId: String(publicId) });
    return {
      restaurantId: restaurant?._id || null,
      restaurant,
    };
  }

  return { restaurantId: null, restaurant: null };
};

module.exports = { ensureRestaurantForUser };
