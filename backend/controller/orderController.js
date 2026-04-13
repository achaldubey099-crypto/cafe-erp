const Order = require('../models/Order');

// Create Order (WITH CART LOGIC)
exports.createOrder = async (req, res) => {
    try {
        const {
            tableId,
            items,
            paymentMethod,
            splitBill
        } = req.body;

        if (!tableId || !items || items.length === 0) {
            return res.status(400).json({ message: "Invalid order data" });
        }

        // 🧮 Calculate subtotal
        const totalAmount = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // 💰 Static fees
        const platformFee = 1.2;
        const serviceTax = 0.8;

        const grandTotal = totalAmount + platformFee + serviceTax;

        // 👥 Split bill logic
        let splitData = {
            isSplit: false,
            peopleCount: 1,
            perPersonAmount: grandTotal
        };

        if (splitBill?.isSplit) {
            const count = splitBill.peopleCount || 1;

            splitData = {
                isSplit: true,
                peopleCount: count,
                perPersonAmount: grandTotal / count
            };
        }

        const order = await Order.create({
            tableId,
            items,
            paymentMethod,
            totalAmount,
            platformFee,
            serviceTax,
            grandTotal,
            splitBill: splitData
        });

        res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Orders
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Orders by Table
exports.getOrdersByTable = async (req, res) => {
    try {
        const { tableId } = req.query;

        if (!tableId) {
            return res.status(400).json({ message: "tableId is required" });
        }

        const orders = await Order.find({ tableId });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Latest Order by Table
exports.getLatestOrderByTable = async (req, res) => {
    try {
        const { tableId } = req.query;

        if (!tableId) {
            return res.status(400).json({ message: "tableId is required" });
        }

        const order = await Order.findOne({ tableId })
            .sort({ createdAt: -1 });

        if (!order) {
            return res.status(404).json({ message: "No orders found" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Order Status (Kitchen Flow)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "preparing", "ready"];

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            message: "Order status updated",
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ⭐ PROFILE API (NEW)
exports.getProfileData = async (req, res) => {
    try {
        const { tableId } = req.query;

        if (!tableId) {
            return res.status(400).json({ message: "tableId is required" });
        }

        const orders = await Order.find({ tableId });

        // 💰 Total spent
        const totalSpent = orders.reduce(
            (sum, order) => sum + (order.grandTotal || 0),
            0
        );

        // ⭐ Points logic (10% of total spend)
        const points = Math.floor(totalSpent * 0.1);

        // 📦 Sort orders (latest first)
        const pastOrders = orders.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            user: {
                name: "Guest User",
                tableId
            },
            points,
            totalSpent,
            pastOrders
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};