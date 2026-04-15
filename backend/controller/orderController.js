const Order = require('../models/Order');

const PAYMENT_METHOD_MAP = {
    upi: "UPI",
    card: "Card",
    counter: "Counter",
};

const normalizePaymentMethod = (value) => {
    if (!value) {
        return "UPI";
    }

    const key = String(value).trim().toLowerCase();
    return PAYMENT_METHOD_MAP[key] || null;
};


// ================= CREATE ORDER =================
exports.createOrder = async (req, res) => {
    try {
        const {
            tableId,
            sessionId,
            items,
            paymentMethod,
            splitBill
        } = req.body;

        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

        // 🔴 Validation
        if (!tableId || !items || items.length === 0) {
            return res.status(400).json({ message: "Invalid order data" });
        }

        if (!normalizedPaymentMethod) {
            return res.status(400).json({ message: "Invalid payment method" });
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
            sessionId, // ✅ IMPORTANT (added)
            userId: req.user?.role === "user" ? req.user.id : null,
            items,
            paymentMethod: normalizedPaymentMethod,
            totalAmount,
            platformFee,
            serviceTax,
            grandTotal,
            splitBill: splitData,
            status: "pending" // ✅ ensure default
        });

        console.log("✅ Order Created:", order._id); // DEBUG

        res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        console.error("❌ Create Order Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// ================= GET ALL ORDERS (ADMIN) =================
exports.getOrders = async (req, res) => {
    try {
        const { userId } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 }); // ✅ latest first

        res.json(orders);
    } catch (error) {
        console.error("❌ Get Orders Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// ================= GET ORDERS BY TABLE =================
exports.getOrdersByTable = async (req, res) => {
    try {
        const { tableId } = req.query;

        if (!tableId) {
            return res.status(400).json({ message: "tableId is required" });
        }

        const orders = await Order.find({ tableId })
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("❌ Get Orders By Table Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// ================= GET LATEST ORDER =================
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
        console.error("❌ Get Latest Order Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// ================= UPDATE ORDER STATUS =================
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

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
        console.error("❌ Update Status Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// ================= PROFILE API =================
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

        // ⭐ Points logic
        const points = Math.floor(totalSpent * 0.1);

        // 📦 Sort latest first
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
        console.error("❌ Profile Error:", error);
        res.status(500).json({ message: error.message });
    }
};
