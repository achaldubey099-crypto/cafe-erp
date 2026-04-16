const crypto = require("crypto");

const createPublicId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString("hex")}`;

module.exports = { createPublicId };
