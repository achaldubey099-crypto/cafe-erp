const mongoose = require('mongoose');
const { ensureDefaultSuperadmin } = require('../utils/ensureDefaultSuperadmin');
const { ensurePublicAccessKeys } = require('../utils/ensurePublicAccessKeys');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await ensureDefaultSuperadmin();
        await ensurePublicAccessKeys();
        console.log("MongoDB Connected");
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
