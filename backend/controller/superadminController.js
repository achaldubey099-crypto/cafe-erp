const bcrypt = require("bcryptjs");
const Restaurant = require("../models/Restaurant");
const Cafe = require("../models/Cafe");
const Table = require("../models/Table");
const User = require("../models/User");
const StoreSettings = require("../models/StoreSettings");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const serializeRestaurant = (restaurant, owner) => ({
  _id: restaurant._id,
  brandName: restaurant.brandName,
  slug: restaurant.slug,
  publicRestaurantId: restaurant.publicRestaurantId,
  logoUrl: restaurant.logoUrl || "",
  active: restaurant.active,
  owner: owner
    ? {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
      }
    : null,
});

const listRestaurants = async (_req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 }).lean();
    const owners = await User.find({ role: "owner" }, "name email restaurantId").lean();
    const ownerMap = new Map(owners.map((owner) => [String(owner.restaurantId), owner]));

    res.json(restaurants.map((restaurant) => serializeRestaurant(restaurant, ownerMap.get(String(restaurant._id)))));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRestaurantWithOwner = async (req, res) => {
  try {
    const {
      brandName,
      logoUrl = "",
      ownerName,
      ownerEmail,
      ownerPassword,
      tableCount = 8,
    } = req.body;

    if (!brandName || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ message: "brandName, ownerName, ownerEmail and ownerPassword are required" });
    }

    const existingOwner = await User.findOne({ email: ownerEmail });
    if (existingOwner) {
      return res.status(400).json({ message: "Owner email already exists" });
    }

    const slugBase = slugify(brandName);
    let slug = slugBase;
    let suffix = 1;
    while (await Restaurant.findOne({ slug })) {
      suffix += 1;
      slug = `${slugBase}-${suffix}`;
    }

    const restaurant = await Restaurant.create({
      brandName,
      slug,
      logoUrl,
    });

    // Create a corresponding Cafe entry for multi-tenant mapping
    const cafe = await Cafe.create({
      name: brandName,
      ownerName,
      email: ownerEmail,
      features: ['POS', 'inventory', 'analytics'],
      subscriptionStatus: 'active',
    });

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    const owner = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: "owner",
      authProvider: "local",
      restaurantId: restaurant._id,
      cafeId: cafe._id,
    });

    const totalTables = Math.max(1, Number(tableCount) || 1);
    const tableDocs = Array.from({ length: totalTables }, (_, index) => ({
      restaurantId: restaurant._id,
      cafeId: cafe._id,
      label: `Table ${index + 1}`,
      tableNumber: index + 1,
    }));
    await Table.insertMany(tableDocs);
    await StoreSettings.create({ restaurantId: restaurant._id, cafeId: cafe._id, profitMargin: 0.4 });

    res.status(201).json({
      message: "Restaurant and owner created successfully",
      restaurant: serializeRestaurant(restaurant.toObject(), owner),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRestaurantOwner = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const owner = await User.findOne({ restaurantId: restaurant._id, role: "owner" }).select("+password");
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const { brandName, logoUrl, ownerName, ownerEmail, ownerPassword, active } = req.body;

    if (brandName) {
      restaurant.brandName = brandName;
      restaurant.slug = slugify(brandName);
    }
    if (logoUrl !== undefined) {
      restaurant.logoUrl = logoUrl;
    }
    if (active !== undefined) {
      restaurant.active = Boolean(active);
    }

    if (ownerName) owner.name = ownerName;
    if (ownerEmail) owner.email = ownerEmail;
    if (ownerPassword) {
      owner.password = await bcrypt.hash(ownerPassword, 10);
    }

    await restaurant.save();
    await owner.save();

    res.json({
      message: "Restaurant updated successfully",
      restaurant: serializeRestaurant(restaurant.toObject(), owner),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listRestaurants,
  createRestaurantWithOwner,
  updateRestaurantOwner,
  // new multi-tenant cafe management
  listCafes: async (req, res) => {
    try {
      const cafes = await Cafe.find().sort({ createdAt: -1 }).lean();
      res.json(cafes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  updateCafe: async (req, res) => {
    try {
      const cafe = await Cafe.findById(req.params.id);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

      const { name, ownerName, email, subscriptionStatus, subscriptionExpiry, features } = req.body;

      if (name !== undefined) cafe.name = name;
      if (ownerName !== undefined) cafe.ownerName = ownerName;
      if (email !== undefined) cafe.email = email;
      if (subscriptionStatus !== undefined) cafe.subscriptionStatus = subscriptionStatus;
      if (subscriptionExpiry !== undefined) cafe.subscriptionExpiry = subscriptionExpiry;
      if (features !== undefined) cafe.features = Array.isArray(features) ? features : cafe.features;

      await cafe.save();
      res.json({ message: 'Cafe updated', cafe });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  createCafe: async (req, res) => {
    try {
      const { name, ownerName, email, features = ['POS'], subscriptionExpiry = null } = req.body;
      if (!name || !ownerName || !email) return res.status(400).json({ message: 'name, ownerName and email are required' });

      const cafe = await Cafe.create({ name, ownerName, email, features, subscriptionExpiry });
      res.status(201).json({ message: 'Cafe created', cafe });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
