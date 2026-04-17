const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { protectAdmin } = require('./middleware/auth');

const app = express();

// ================= DB CONNECTION =================
connectDB();

// ================= MIDDLEWARE =================

const isProduction = process.env.NODE_ENV === "production";
const explicitAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl)
        if (!origin) return callback(null, true);

        if (!isProduction) {
            callback(null, true);
            return;
        }

        if (explicitAllowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("❌ Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// ✅ Body Parser
app.use(express.json());

// Attach cafe info when token present (adds req.cafe and req.cafeId)
const { attachCafe } = require('./middleware/tenant');
app.use(attachCafe);

// ================= ROUTES =================

// Existing Routes
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

// Payment Routes
const paymentRoutes = require('./routes/paymentRoutes');

// Auth & Admin
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const superadminRoutes = require('./routes/superadminRoutes');

// Staff / Analytics / Inventory
const staffRoutes = require('./routes/staffRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { startSubscriptionWatcher } = require('./utils/subscriptionWatcher');

// Debug: log types of imported routers/middleware to detect import/export mismatches
console.log('TYPE menuRoutes:', typeof menuRoutes);
console.log('TYPE orderRoutes:', typeof orderRoutes);
console.log('TYPE categoryRoutes:', typeof categoryRoutes);
console.log('TYPE feedbackRoutes:', typeof feedbackRoutes);
console.log('TYPE favoriteRoutes:', typeof favoriteRoutes);
console.log('TYPE paymentRoutes:', typeof paymentRoutes);
console.log('TYPE authRoutes:', typeof authRoutes);
console.log('TYPE adminRoutes:', typeof adminRoutes);
console.log('TYPE adminOrderRoutes:', typeof adminOrderRoutes);
console.log('TYPE superadminRoutes:', typeof superadminRoutes);
console.log('TYPE staffRoutes:', typeof staffRoutes);
console.log('TYPE analyticsRoutes:', typeof analyticsRoutes);
console.log('TYPE inventoryRoutes:', typeof inventoryRoutes);

// ================= API ROUTES =================
app.use("/api/payment", paymentRoutes);

// ✅ PUBLIC APIs
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/favorites', favoriteRoutes);

// ✅ AUTH & ADMIN
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-orders', adminOrderRoutes);
app.use('/api/superadmin', superadminRoutes);

// 🔐 PROTECTED ADMIN APIs
app.use('/api/staff', protectAdmin, staffRoutes);
app.use('/api/analytics', protectAdmin, analyticsRoutes);
app.use('/api/inventory', protectAdmin, inventoryRoutes);

// ================= TEST ROUTE =================
app.get('/', (req, res) => {
    res.send('Cafe ERP Backend Running');
});

// ================= ERROR HANDLING =================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    res.status(err.status || 500).json({
        message: err.message || "Something went wrong"
    });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
        // start subscription watcher (non-blocking)
        try {
            startSubscriptionWatcher();
        } catch (err) {
            console.error('Failed to start subscription watcher', err);
        }
});
