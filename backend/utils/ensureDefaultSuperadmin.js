const bcrypt = require("bcryptjs");
const User = require("../models/User");

const LEGACY_SUPERADMIN_EMAIL = "admin";
const DEFAULT_SUPERADMIN_EMAIL = "superadmin@cafes.local";
const DEFAULT_SUPERADMIN_PASSWORD = "CafesRoot2026Secure!";
const DEFAULT_SUPERADMIN_NAME = "Cafes Platform Superadmin";

const ensureDefaultSuperadmin = async () => {
  const email = String(process.env.SUPERADMIN_EMAIL || DEFAULT_SUPERADMIN_EMAIL)
    .trim()
    .toLowerCase();
  const password = String(process.env.SUPERADMIN_PASSWORD || DEFAULT_SUPERADMIN_PASSWORD).trim();
  const name = String(process.env.SUPERADMIN_NAME || DEFAULT_SUPERADMIN_NAME).trim();

  if (!email || !password) {
    return;
  }

  let user = await User.findOne({ email }).select("+password");

  if (!user && email !== LEGACY_SUPERADMIN_EMAIL) {
    const legacyUser = await User.findOne({
      email: LEGACY_SUPERADMIN_EMAIL,
      role: "superadmin",
    }).select("+password");

    if (legacyUser) {
      legacyUser.email = email;
      user = legacyUser;
    }
  }

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
      authProvider: "local",
    });
    console.log(`Seeded default superadmin credentials for ${email}`);
    return;
  }

  let updated = false;

  if (user.email !== email) {
    user.email = email;
    updated = true;
  }

  if (user.name !== name) {
    user.name = name;
    updated = true;
  }

  if (user.role !== "superadmin") {
    user.role = "superadmin";
    updated = true;
  }

  const passwordMatches = user.password ? await bcrypt.compare(password, user.password) : false;

  if (!passwordMatches) {
    user.password = await bcrypt.hash(password, 10);
    updated = true;
  }

  if (user.authProvider !== "local") {
    user.authProvider = "local";
    updated = true;
  }

  if (updated) {
    await user.save();
    console.log(`Updated default superadmin account for ${email}`);
  }

  if (email !== LEGACY_SUPERADMIN_EMAIL) {
    await User.deleteMany({
      email: LEGACY_SUPERADMIN_EMAIL,
      role: "superadmin",
      _id: { $ne: user._id },
    });
  }
};

module.exports = {
  DEFAULT_SUPERADMIN_EMAIL,
  DEFAULT_SUPERADMIN_PASSWORD,
  ensureDefaultSuperadmin,
};
