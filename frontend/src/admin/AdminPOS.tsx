import React, { useState, useMemo } from "react";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  Plus,
  Minus,
} from "lucide-react";

import { PRODUCTS } from "../constants";
import { cn } from "../lib/utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function AdminPOS() {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...new Set(PRODUCTS.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  // ✅ ADD ITEM
  const addToOrder = (product: typeof PRODUCTS[0]) => {
    setCurrentOrder(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ✅ UPDATE QTY
  const updateQuantity = (id: string, delta: number) => {
    setCurrentOrder(prev =>
      prev
        .map(i =>
          i.id === id
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  };

  // ✅ REMOVE
  const removeFromOrder = (id: string) => {
    setCurrentOrder(prev => prev.filter(i => i.id !== id));
  };

  // ✅ TOTALS
  const subtotal = currentOrder.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8">

      {/* PRODUCTS */}
      <div className="flex-1 flex flex-col">

        {/* CATEGORY */}
        <div className="flex gap-3 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm",
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => addToOrder(p)}
              className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md"
            >
              <img src={p.image} className="h-32 w-full object-cover rounded-lg" />
              <h3 className="font-bold mt-2">{p.name}</h3>
              <p className="text-sm text-gray-500">${p.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CART */}
      <div className="w-[350px] bg-white rounded-2xl shadow-sm p-4 flex flex-col">

        <h2 className="font-bold mb-4">Current Order</h2>

        {/* ITEMS */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {currentOrder.length === 0 ? (
            <p className="text-gray-400">No items</p>
          ) : (
            currentOrder.map(i => (
              <div key={i.id} className="flex justify-between items-center">
                <div>
                  <p>{i.name}</p>
                  <p className="text-sm">${i.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(i.id, -1)}>
                    <Minus size={14} />
                  </button>
                  <span>{i.quantity}</span>
                  <button onClick={() => updateQuantity(i.id, 1)}>
                    <Plus size={14} />
                  </button>
                </div>

                <button onClick={() => removeFromOrder(i.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* TOTAL */}
        <div className="mt-4 border-t pt-4 space-y-2">
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>Tax: ${tax.toFixed(2)}</p>
          <p className="font-bold text-lg">Total: ${total.toFixed(2)}</p>

          <button className="w-full bg-primary text-white py-2 rounded-lg mt-2">
            <CreditCard size={16} className="inline mr-2" />
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}