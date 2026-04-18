const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureRestaurantForCafe = async (cafeId) => {
  if (!cafeId) {
    return null;
  }

  const Cafe = require("../models/Cafe");
  const cafe = await Cafe.findById(cafeId);
  if (!cafe) {
    return null;
  }

  if (cafe.restaurantRef) {
    return cafe.restaurantRef;
  }

  const baseSlug = slugify(cafe.name || cafe.ownerName || "cafe");
  let slug = baseSlug || `cafe-${String(cafe._id).slice(-6)}`;
  let suffix = 1;

  while (await Restaurant.findOne({ slug }).lean()) {
    suffix += 1;
    slug = `${baseSlug || "cafe"}-${suffix}`;
  }

  const restaurant = await Restaurant.create({
    brandName: cafe.name || cafe.ownerName || "Cafe",
    slug,
    logoUrl: "",
    description: "",
  });

  cafe.restaurantRef = restaurant._id;
  await cafe.save();

  await User.updateMany(
    {
      cafeId: cafe._id,
      role: { $in: ["admin", "owner"] },
    },
    {
      $set: { restaurantId: restaurant._id },
    }
  );

  return restaurant._id;
};

const ensureRestaurantForUser = async (req) => {
  // If request has cafeId from JWT, prefer it and resolve linked Restaurant
  if (req.cafeId) {
    const Cafe = require('../models/Cafe');
    const cafe = await Cafe.findById(req.cafeId).lean();
    if (cafe && cafe.restaurantRef) {
      return { restaurantId: cafe.restaurantRef, restaurant: null, cafeId: req.cafeId };
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
      return { restaurantId: linkedOwner.restaurantId, restaurant: null, cafeId: req.cafeId };
    }

    if (["admin", "owner"].includes(req.user?.role)) {
      const restaurantId = await ensureRestaurantForCafe(req.cafeId);
      if (restaurantId) {
        return { restaurantId, restaurant: null, cafeId: req.cafeId };
      }
    }
  }

  if (["admin", "owner"].includes(req.user?.role) && req.user.restaurantId) {
    return { restaurantId: req.user.restaurantId, restaurant: null, cafeId: req.cafeId || null };
  }

  if (req.user?.role === "superadmin") {
    const publicId =
      req.query.restaurant ||
      req.query.restaurantId ||
      req.body?.restaurant ||
      req.body?.restaurantId ||
      null;

    if (!publicId) {
      return { restaurantId: null, restaurant: null, cafeId: req.cafeId || null };
    }

    const restaurant = await Restaurant.findOne({ publicRestaurantId: String(publicId) });
    return {
      restaurantId: restaurant?._id || null,
      restaurant,
      cafeId: req.cafeId || null,
    };
  }

  return { restaurantId: null, restaurant: null, cafeId: req.cafeId || null };
};

module.exports = { ensureRestaurantForUser };
