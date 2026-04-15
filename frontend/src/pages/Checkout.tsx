import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  HelpCircle,
  Minus,
  Plus,
  QrCode,
  CreditCard,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import API from "../lib/api";
import { getTableId } from "../lib/table";

type RazorpayOrderResponse = {
  id?: string;
  order_id?: string;
  _id?: string;
  amount?: number;
  amount_due?: number;
  total?: number;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { customer } = useAuth();

  const [people, setPeople] = useState(1);
  const [sessionId, setSessionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // ✅ GET TABLE
  const tableId = getTableId();

  // ✅ CREATE SESSION (ONLY ONCE)
  useEffect(() => {
    let existingSession = localStorage.getItem("sessionId");

    if (!existingSession && tableId) {
      existingSession = Date.now() + "_" + tableId;
      localStorage.setItem("sessionId", existingSession);
    }

    setSessionId(existingSession || "");
  }, [tableId]);

  // 🔥 CALCULATIONS
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const platformFee = 20;
  const tax = Math.round(subtotal * 0.05);

  const total = subtotal + platformFee + tax;
  const perPerson = total / people;

  // ================= PLACE ORDER =================
  const placeOrder = async (paymentMethod: string) => {
    try {
      // ❌ VALIDATION
      if (!tableId) {
        alert("Table not found. Please scan QR again.");
        return;
      }

      if (!cart || cart.length === 0) {
        alert("Cart is empty");
        return;
      }

      const orderData = {
        tableId,
        sessionId,
        userId: customer?._id,
        items: cart.map((item, index) => ({
          itemId: index + 1,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod,
        splitBill: {
          isSplit: people > 1,
          peopleCount: people,
        },
      };

      console.log("📦 Sending Order:", orderData);

      const res = await API.post("/orders", orderData);

      console.log("✅ Order Success:", res.data);

      alert("Order placed successfully!");

      clearCart();

      navigate(`/orders?tableId=${tableId}`);

    } catch (err: any) {
      console.error("❌ Order Failed:", err.response?.data || err.message);

      alert(
        err.response?.data?.message || "Failed to place order. Try again."
      );
    }
  };

  // ================= RAZORPAY PAYMENT =================
  const handlePayment = async () => {
    try {
      const res = await API.post<RazorpayOrderResponse | { order?: RazorpayOrderResponse }>(
        "/payment/create-order",
        { amount: total }
      );

      console.log("create-order response:", res);

      // backend may return shape: { order: { id, amount } } or direct order
      const payload = res.data as RazorpayOrderResponse | { order?: RazorpayOrderResponse };
      const order = (payload as { order?: RazorpayOrderResponse }).order ?? (payload as RazorpayOrderResponse);
      if (!order) {
        throw new Error('Invalid order response');
      }
      const orderId = order.id || order.order_id || order._id;
      const orderAmount = order.amount || order.amount_due || order.total || total;

      const options = {
        key: "rzp_test_SdShGK2Y6Cgv4Y",
        amount: orderAmount,
        currency: "INR",
        name: "Cafe ERP",
        description: "Order Payment",
        order_id: orderId,

        handler: async function (response: any) {
          console.log("Payment Success", response);

          try {
            await API.post("/payment/verify", response);
          } catch (err) {
            console.error("Payment verify failed:", err);
          }

          // after successful payment verification, place the order in our system
          await placeOrder(paymentMethod);
        },

        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay init failed:", err);
      alert("Payment could not be initiated. Please try again.");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-80">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="font-bold text-lg text-primary">
            Finalize Order
          </h1>
        </div>
        <HelpCircle size={20} className="text-secondary" />
      </header>

      {/* MAIN */}
      <main className="pt-24 px-6 space-y-8 max-w-md mx-auto">

        {/* CART */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold">Your Tray</h2>
            <span className="text-xs text-secondary">
              {cart.length} ITEMS
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 space-y-4 shadow-xl">
            {cart.map((item) => (
              <div key={item._id} className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />

                <div className="flex-1 flex justify-between">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-secondary">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SPLIT BILL */}
        <section className="bg-primary-container/10 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Split Bill</h3>
          </div>

          <div className="flex justify-between items-center bg-white rounded-2xl p-4">
            <span>People</span>

            <div className="flex items-center gap-4">
              <button onClick={() => setPeople(Math.max(1, people - 1))}>
                <Minus size={16} />
              </button>

              <span>{people}</span>

              <button onClick={() => setPeople(people + 1)}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <span>Per Person</span>
            <span>₹{perPerson.toFixed(0)}</span>
          </div>
        </section>

        {/* TOTAL */}
        <section className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Platform Fee</span>
            <span>₹{platformFee}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>₹{tax}</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-24 left-0 w-full bg-white px-6 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] z-[9999]">
        <div className="flex flex-col gap-5 max-w-md mx-auto relative pb-safe">
          
          <div>
            <h3 className="font-bold text-sm text-secondary mb-3 px-1">Payment Method</h3>
            <div className="flex gap-3">
              {[
                { id: "UPI", icon: QrCode, label: "UPI" },
                { id: "Card", icon: CreditCard, label: "Card" },
                { id: "Counter", icon: Wallet, label: "Counter" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex-1 py-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/5 text-primary shadow-sm scale-100"
                      : "border-surface-container-high text-secondary hover:bg-surface-container scale-[0.98]"
                  }`}
                >
                  <method.icon size={22} className={paymentMethod === method.id ? 'stroke-[2.5px]' : ''} />
                  <span className="text-xs font-bold tracking-wide">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
              onClick={() => {
                if (String(paymentMethod).toLowerCase() === "counter") {
                  if (typeof placeOrder === "function") {
                    placeOrder(paymentMethod);
                  }
                } else {
                  if (typeof handlePayment === "function") {
                    handlePayment();
                  }
                }
              }}
            className="w-full h-[64px] bg-primary text-white rounded-2xl font-bold flex items-center justify-between px-7 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all"
          >
            <span className="text-lg">Place Order</span>
            <span className="flex items-center gap-2 text-lg">₹{total} <ArrowRight size={20} strokeWidth={2.5} /></span>
          </button>

        </div>
      </footer>
    </div>
  );
}
