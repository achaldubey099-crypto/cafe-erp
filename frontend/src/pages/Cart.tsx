import React from "react";
import { ShoppingCart, ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getCustomerMenuPath } from "../lib/tenant";

export default function Cart() {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, deleteFromCart, clearCart } = useCart();
  const menuPath = getCustomerMenuPath();

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-background min-h-screen pb-56">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-sm flex items-center px-4 h-16">
        <div className="flex items-center w-full justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>

          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">
            Your Cart ({totalItems})
          </h1>

          <button
            onClick={clearCart}
            className="text-xs text-red-500 font-semibold"
          >
            Clear
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-md mx-auto">
        {cart.length === 0 ? (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center text-primary/20">
              <ShoppingCart size={48} />
            </div>

            <div className="space-y-2">
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                Your cart is empty
              </h2>
              <p className="text-on-surface-variant text-sm px-8">
                Looks like you haven't added any brews yet.
              </p>
            </div>

            <button
              onClick={() => navigate(menuPath)}
              className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-headline font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          // CART ITEMS
          <div className="space-y-6">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 items-center bg-surface-container p-3 rounded-2xl"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-headline font-bold text-on-surface">
                    {item.name}
                  </h3>

                  <p className="text-sm text-secondary mt-1">
                    ₹{item.price}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="font-bold">{item.quantity}</span>

                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => deleteFromCart(item._id)}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full z-40 bg-background border-t border-surface-container p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary">Total</p>
              <h2 className="font-headline font-bold text-xl text-primary">
                ₹{totalPrice}
              </h2>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-headline font-bold shadow-lg active:scale-95"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
