const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// 🔐 AUTH MIDDLEWARE
const { protectAdmin } = require('./middleware/auth');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
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

// ⭐ STAFF ROUTES
const staffRoutes = require('./routes/staffRoutes');

// ⭐ ANALYTICS ROUTES
const analyticsRoutes = require('./routes/analyticsRoutes');

// ⭐ INVENTORY ROUTES (NEW ✅)
const inventoryRoutes = require('./routes/inventoryRoutes');

// ================= API ROUTES =================

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/favorites', favoriteRoutes);

// Auth & Admin APIs
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ⭐ STAFF MANAGEMENT (ADMIN ONLY)
app.use('/api/staff', protectAdmin, staffRoutes);

// ⭐ ANALYTICS (ADMIN ONLY)
app.use('/api/analytics', protectAdmin, analyticsRoutes);

// ⭐ INVENTORY (ADMIN ONLY 🔥)
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
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong" });
});

// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});