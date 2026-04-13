import React, { useState } from "react";
import {
  ArrowLeft,
  HelpCircle,
  Minus,
  Plus,
  QrCode,
  CreditCard,
  Wallet,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import API from "../lib/api";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const [people, setPeople] = useState(1);

  // 🔥 REAL CALCULATIONS
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const platformFee = 20;
  const tax = Math.round(subtotal * 0.05);

  const total = subtotal + platformFee + tax;
  const perPerson = total / people;

  // 🔥 PLACE ORDER
  const handleOrder = async () => {
    try {
      await API.post("/orders", {
        items: cart,
        total,
      });

      clearCart();
      navigate("/orders");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg text-primary">
            Finalize Order
          </h1>
        </div>
        <HelpCircle size={20} className="text-secondary" />
      </header>

      <main className="pt-24 px-6 space-y-8 max-w-md mx-auto">
        {/* CART ITEMS */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="font-headline text-2xl font-extrabold">
              Your Tray
            </h2>
            <span className="text-xs font-bold text-secondary uppercase">
              {cart.length} ITEMS
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 space-y-4 shadow-xl">
            {cart.map((item) => (
              <div key={item._id} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-bold">{item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>

                  <span className="text-xs text-secondary">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SPLIT BILL */}
        <section className="bg-primary-container/10 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-primary">Split Bill</h3>
          </div>

          <div className="flex justify-between items-center bg-white rounded-2xl p-4">
            <span>People</span>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPeople(Math.max(1, people - 1))}
                className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
              >
                <Minus size={16} />
              </button>

              <span className="font-bold">{people}</span>

              <button
                onClick={() => setPeople(people + 1)}
                className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <span>Per Person</span>
            <span className="font-bold text-primary">
              ₹{perPerson.toFixed(0)}
            </span>
          </div>
        </section>

        {/* PAYMENT */}
        <section>
          <h3 className="font-bold mb-3">Payment Method</h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-primary text-white text-center">
              <QrCode />
              <p className="text-xs mt-1">UPI</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-200 text-center">
              <CreditCard />
              <p className="text-xs mt-1">Card</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-200 text-center">
              <Wallet />
              <p className="text-xs mt-1">Wallet</p>
            </div>
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
      <footer className="fixed bottom-0 w-full bg-white p-4">
        <button
          onClick={handleOrder}
          className="w-full h-14 bg-primary text-white rounded-2xl font-bold flex justify-between items-center px-6"
        >
          <span>Pay ₹{total}</span>
          <ArrowRight />
        </button>
      </footer>
    </div>
  );
}