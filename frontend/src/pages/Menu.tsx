import React, { useState, useEffect } from "react";
import { Search, Heart, Plus, Bell, User as UserIcon, ShoppingCart } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import API from "../lib/api";
import { Product } from "../types";
import { useCart } from "../context/CartContext";

export default function Menu() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [products, setProducts] = useState<Product[]>([]);

  const { addToCart, cart } = useCart();

  const categories = ["Coffee", "Snacks", "Desserts", "Teas", "Seasonal"];

  // 🔥 Fetch products from backend
  useEffect(() => {
    API.get("/menu")
      .then((res) => setProducts(res.data))
      .catch(console.error);
  }, []);

  // 🔥 Filtering logic
  const featuredProduct = products.find((p) => p.isFeatured);
  const filteredProducts = products.filter(
    (p) => p.category === activeCategory && !p.isFeatured
  );

  // 🔥 Cart calculations
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary font-headline tracking-tight">
              Artisan Café
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">
              Morning Brews
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
              <Bell size={20} className="text-primary" />
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
              <UserIcon size={20} className="text-primary" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Search */}
        <section className="px-6 mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-outline" />
            </div>
            <input
              type="text"
              placeholder="Search your favorite brew..."
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/60 font-medium transition-all outline-none"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="mb-8">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 px-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex-none px-6 py-2.5 rounded-full font-headline font-bold text-sm transition-all active:scale-95",
                  activeCategory === cat
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Featured */}
        {featuredProduct && (
          <section className="px-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-48 rounded-3xl overflow-hidden group"
            >
              <img
                src={featuredProduct.image}
                alt={featuredProduct.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block bg-on-primary-container text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded mb-2">
                  Editor's Choice
                </span>
                <h3 className="text-white font-headline text-xl font-bold leading-tight">
                  {featuredProduct.name}
                </h3>
                <p className="text-white/80 text-xs mt-1">
                  {featuredProduct.description}
                </p>
              </div>
            </motion.div>
          </section>
        )}

        {/* Product Grid */}
        <section className="px-6">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              {activeCategory} Menu
            </h2>
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest pb-1">
              {filteredProducts.length} Items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-surface-container-low mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform">
                    <Heart size={16} />
                  </button>
                </div>

                <div className="px-1">
                  <h4 className="font-headline font-bold text-on-surface leading-tight">
                    {product.name}
                  </h4>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-headline font-extrabold text-primary">
                      ₹{product.price}
                    </span>

                    <button
                      onClick={() => addToCart(product)}
                      className="bg-primary text-on-primary p-2 rounded-xl active:scale-90 transition-transform shadow-md shadow-primary/20"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Cart Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/checkout")}
          className="flex items-center gap-3 bg-primary text-on-primary px-5 py-4 rounded-3xl shadow-2xl shadow-primary/40"
        >
          <ShoppingCart size={20} fill="currentColor" />
          <span className="font-headline font-bold text-sm">
            {totalItems} items • ₹{totalPrice}
          </span>
        </motion.button>
      </div>
    </div>
  );
}