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
import API from "../lib/api";
import { getTableId } from "../lib/table";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const [people, setPeople] = useState(1);
  const [sessionId, setSessionId] = useState("");

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

  return (
    <div className="bg-background min-h-screen pb-48">
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
      <footer className="fixed bottom-0 w-full bg-white p-4 shadow-md">
        <div className="flex flex-col gap-3">
          
          {/* PAY LATER */}
          <button
            onClick={() => placeOrder("UPI")}
            className="h-14 border rounded-2xl font-bold"
          >
            Place Order (Pay Later / Cash)
          </button>

          {/* PAY ONLINE */}
          <button
            onClick={() => placeOrder("UPI")}
            className="h-14 bg-primary text-white rounded-2xl font-bold flex justify-between px-6"
          >
            <span>Pay Online</span>
            <span>₹{total} →</span>
          </button>

        </div>
      </footer>
    </div>
  );
}