const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// 🔐 AUTH MIDDLEWARE
const { protectAdmin } = require('./middleware/auth');

const app = express();

// ================= DB CONNECTION =================
connectDB();

// ================= MIDDLEWARE =================

// ✅ CORS (ALLOW FRONTEND ACCESS)
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
}));

// ✅ Body Parser
app.use(express.json());

// ================= ROUTES =================

// Existing Routes
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

// Auth & Admin
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');

// ⭐ STAFF ROUTES
const staffRoutes = require('./routes/staffRoutes');

// ⭐ ANALYTICS ROUTES
const analyticsRoutes = require('./routes/analyticsRoutes');

// ⭐ INVENTORY ROUTES
const inventoryRoutes = require('./routes/inventoryRoutes');

// ================= API ROUTES =================

// ✅ PUBLIC APIs
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes); // 🔥 IMPORTANT (used by frontend checkout)
app.use('/api/categories', categoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/favorites', favoriteRoutes);

// ✅ AUTH & ADMIN
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-orders', adminOrderRoutes);

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});