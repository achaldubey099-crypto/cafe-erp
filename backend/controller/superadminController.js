const bcrypt = require("bcryptjs");
const Restaurant = require("../models/Restaurant");
const Cafe = require("../models/Cafe");
const Table = require("../models/Table");
const User = require("../models/User");
const StoreSettings = require("../models/StoreSettings");
const Menu = require("../models/Menu");
const Order = require("../models/Order");
const { syncRestaurantAccessKey } = require("../utils/accessKeys");
const { getTableSlug } = require("../utils/tableSlug");
const { getPaginationParams, buildPaginationMeta, escapeRegex } = require("../utils/pagination");
const ADMIN_ACCESS_ROLES = ["admin", "owner"];

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
  accessKey: restaurant.accessKey || "",
  logoUrl: restaurant.logoUrl || "",
  active: restaurant.active,
  owner: owner
    ? {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        status: owner.status || "active",
      }
    : null,
});

const serializeAdminAccount = (user, cafe = null, restaurant = null) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  cafeId: user.cafeId || null,
  cafeName: cafe?.name || "",
  restaurantId: user.restaurantId || cafe?.restaurantRef || null,
  restaurantName: restaurant?.brandName || "",
  authProvider: user.authProvider || "local",
  status: user.status || "active",
  createdAt: user.createdAt,
});

const resolveRestaurantIdForCafe = async (cafe) => {
  if (!cafe) return null;
  if (cafe.restaurantRef) return cafe.restaurantRef;

  const linkedOwner = await User.findOne(
    {
      cafeId: cafe._id,
      role: "owner",
      restaurantId: { $ne: null },
    },
    "restaurantId"
  ).lean();

  if (linkedOwner?.restaurantId) {
    await Cafe.findByIdAndUpdate(cafe._id, { restaurantRef: linkedOwner.restaurantId });
    return linkedOwner.restaurantId;
  }

  return null;
};

const countRemainingTenantAccess = async ({ cafeId = null, restaurantId = null }) => {
  const scope = [
    ...(cafeId ? [{ cafeId }] : []),
    ...(restaurantId ? [{ restaurantId }] : []),
  ];

  if (scope.length === 0) {
    return 0;
  }

  return User.countDocuments({
    role: { $in: ADMIN_ACCESS_ROLES },
    $or: scope,
  });
};

const purgeCafeTenantData = async ({ cafeId = null, restaurantId = null }) => {
  const tenantCafeId = cafeId || null;
  const tenantRestaurantId = restaurantId || null;

  if (tenantCafeId) {
    await User.deleteMany({ cafeId: tenantCafeId });
    await Order.deleteMany({ cafeId: tenantCafeId });
    await Menu.deleteMany({ cafeId: tenantCafeId });
    await Table.deleteMany({ cafeId: tenantCafeId });
    await StoreSettings.deleteMany({ cafeId: tenantCafeId });
    await Cafe.deleteOne({ _id: tenantCafeId });
  }

  if (tenantRestaurantId) {
    await User.deleteMany({ restaurantId: tenantRestaurantId });
    await Order.deleteMany({ restaurantId: tenantRestaurantId });
    await Menu.deleteMany({ restaurantId: tenantRestaurantId });
    await Table.deleteMany({ restaurantId: tenantRestaurantId });
    await StoreSettings.deleteMany({ restaurantId: tenantRestaurantId });
    await Restaurant.deleteOne({ _id: tenantRestaurantId });
  }
};

const deleteAccessAccountByUser = async (user) => {
  const cafe =
    (user.cafeId ? await Cafe.findById(user.cafeId) : null) ||
    (user.restaurantId ? await Cafe.findOne({ restaurantRef: user.restaurantId }) : null);

  const restaurantId = user.restaurantId || (await resolveRestaurantIdForCafe(cafe));
  const cafeId = cafe?._id || user.cafeId || null;
  const roleLabel = user.role === "owner" ? "Owner" : "Admin";

  await User.deleteOne({ _id: user._id });

  if (user.role === "owner" && cafe) {
    cafe.ownerName = "";
    cafe.email = "";
    await cafe.save();
  }

  const remainingAccessCount = await countRemainingTenantAccess({
    cafeId,
    restaurantId,
  });

  if (remainingAccessCount === 0 && (cafeId || restaurantId)) {
    await purgeCafeTenantData({
      cafeId,
      restaurantId,
    });

    return {
      message: `${roleLabel} account deleted and cafe access removed`,
      deletedAccountId: String(user._id),
      deletedRole: user.role,
      deletedCafeId: cafeId ? String(cafeId) : null,
      deletedRestaurantId: restaurantId ? String(restaurantId) : null,
      tenantDeleted: true,
    };
  }

  return {
    message: `${roleLabel} account deleted successfully`,
    deletedAccountId: String(user._id),
    deletedRole: user.role,
    deletedCafeId: cafeId ? String(cafeId) : null,
    deletedRestaurantId: restaurantId ? String(restaurantId) : null,
    tenantDeleted: false,
  };
};

const listRestaurants = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, skip, shouldPaginate } = getPaginationParams(req.query, {
      defaultLimit: 8,
      maxLimit: 24,
    });
    const restaurantDocs = await Restaurant.find().sort({ createdAt: -1 });
    await Promise.all(restaurantDocs.map((restaurant) => syncRestaurantAccessKey(restaurant)));
    const restaurants = restaurantDocs.map((restaurant) => restaurant.toObject());
    const owners = await User.find({ role: "owner" }, "name email restaurantId status").lean();
    const ownerMap = new Map(owners.map((owner) => [String(owner.restaurantId), owner]));

    const searchPattern = search ? new RegExp(escapeRegex(search), "i") : null;
    const enrichedRestaurants = restaurants.map((restaurant) =>
      serializeRestaurant(restaurant, ownerMap.get(String(restaurant._id)))
    );
    const filteredRestaurants = searchPattern
      ? enrichedRestaurants.filter((restaurant) => (
          searchPattern.test(restaurant.brandName || "") ||
          searchPattern.test(restaurant.slug || "") ||
          searchPattern.test(restaurant.publicRestaurantId || "") ||
          searchPattern.test(restaurant.owner?.name || "") ||
          searchPattern.test(restaurant.owner?.email || "")
        ))
      : enrichedRestaurants;

    if (!shouldPaginate) {
      return res.json(filteredRestaurants);
    }

    res.json({
      restaurants: filteredRestaurants.slice(skip, skip + limit),
      pagination: buildPaginationMeta({
        page,
        limit,
        totalItems: filteredRestaurants.length,
      }),
    });
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
      restaurantRef: restaurant._id,
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
      slug: getTableSlug({ label: `Table ${index + 1}`, tableNumber: index + 1 }),
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

const listAdminAccounts = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, skip, shouldPaginate } = getPaginationParams(req.query, {
      defaultLimit: 10,
      maxLimit: 50,
    });
    const admins = await User.find(
      { role: { $in: ADMIN_ACCESS_ROLES } },
      "name email role cafeId restaurantId authProvider status createdAt"
    )
      .sort({ createdAt: -1 })
      .lean();

    const cafeIds = [...new Set(admins.map((admin) => String(admin.cafeId || "")).filter(Boolean))];
    const cafes = cafeIds.length
      ? await Cafe.find({ _id: { $in: cafeIds } }, "name ownerName email restaurantRef").lean()
      : [];
    const cafeMap = new Map(cafes.map((cafe) => [String(cafe._id), cafe]));

    const restaurantIds = [
      ...new Set(
        admins
          .map((admin) => String(admin.restaurantId || ""))
          .concat(cafes.map((cafe) => String(cafe.restaurantRef || "")))
          .filter(Boolean)
      ),
    ];

    const restaurants = restaurantIds.length
      ? await Restaurant.find({ _id: { $in: restaurantIds } }, "brandName publicRestaurantId").lean()
      : [];
    const restaurantMap = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));

    const adminAccounts = admins.map((admin) => {
      const cafe = admin.cafeId ? cafeMap.get(String(admin.cafeId)) || null : null;
      const restaurantId = admin.restaurantId || cafe?.restaurantRef || null;
      const restaurant = restaurantId ? restaurantMap.get(String(restaurantId)) || null : null;
      return serializeAdminAccount(admin, cafe, restaurant);
    });
    const searchPattern = search ? new RegExp(escapeRegex(search), "i") : null;
    const filteredAdminAccounts = searchPattern
      ? adminAccounts.filter((account) => (
          searchPattern.test(account.name || "") ||
          searchPattern.test(account.email || "") ||
          searchPattern.test(account.role || "") ||
          searchPattern.test(account.status || "") ||
          searchPattern.test(account.cafeName || "") ||
          searchPattern.test(account.restaurantName || "")
        ))
      : adminAccounts;

    res.json({
      admins: shouldPaginate
        ? filteredAdminAccounts.slice(skip, skip + limit)
        : filteredAdminAccounts,
      summary: {
        total: adminAccounts.length,
        admins: adminAccounts.filter((account) => account.role === "admin").length,
        owners: adminAccounts.filter((account) => account.role === "owner").length,
        cafes: new Set(adminAccounts.map((account) => String(account.cafeId || "")).filter(Boolean)).size,
      },
      ...(shouldPaginate
        ? {
            pagination: buildPaginationMeta({
              page,
              limit,
              totalItems: filteredAdminAccounts.length,
            }),
          }
        : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAdminAccount = async (req, res) => {
  try {
    const { name, email, password, cafeId, role = "admin" } = req.body;

    if (!name || !email || !password || !cafeId) {
      return res.status(400).json({ message: "name, email, password and cafeId are required" });
    }

    if (!ADMIN_ACCESS_ROLES.includes(role)) {
      return res.status(400).json({ message: "role must be admin or owner" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User email already exists" });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) {
      return res.status(404).json({ message: "Cafe not found" });
    }

    if (role === "owner") {
      const existingOwner = await User.findOne({ cafeId: cafe._id, role: "owner" });
      if (existingOwner) {
        return res.status(400).json({ message: "This cafe already has an owner account" });
      }
    }

    const restaurantId = await resolveRestaurantIdForCafe(cafe);
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminAccount = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      authProvider: "local",
      cafeId: cafe._id,
      restaurantId: restaurantId || null,
      status: "active",
    });

    if (role === "owner") {
      cafe.ownerName = name;
      cafe.email = email;
      await cafe.save();
    }

    const restaurant = restaurantId
      ? await Restaurant.findById(restaurantId, "brandName publicRestaurantId").lean()
      : null;

    res.status(201).json({
      message: role === "owner" ? "Owner account created successfully" : "Admin account created successfully",
      admin: serializeAdminAccount(adminAccount, cafe.toObject(), restaurant),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setRestaurantOwnerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "status must be active or suspended" });
    }

    const restaurant = await Restaurant.findById(req.params.id).lean();
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const owner = await User.findOne({ restaurantId: restaurant._id, role: "owner" });
    if (!owner) {
      return res.status(404).json({ message: "Owner credentials not found" });
    }

    owner.status = status;
    await owner.save();

    res.json({
      message: status === "suspended" ? "Owner credentials suspended" : "Owner credentials reactivated",
      restaurant: serializeRestaurant(restaurant, owner.toObject()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRestaurantOwnerCredentials = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).lean();
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const owner = await User.findOne({ restaurantId: restaurant._id, role: "owner" });
    if (!owner) {
      return res.status(404).json({ message: "Owner credentials not found" });
    }

    const result = await deleteAccessAccountByUser(owner);

    res.json({
      message: result.message,
      restaurant: result.tenantDeleted ? null : serializeRestaurant(restaurant, null),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAdminAccount = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ADMIN_ACCESS_ROLES },
    });

    if (!user) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    const result = await deleteAccessAccountByUser(user);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listRestaurants,
  createRestaurantWithOwner,
  updateRestaurantOwner,
  listAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
  setRestaurantOwnerStatus,
  deleteRestaurantOwnerCredentials,
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
