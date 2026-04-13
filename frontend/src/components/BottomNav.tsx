import React from 'react';
import { NavLink } from 'react-router-dom';
import { Coffee, ShoppingCart, Receipt, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: Coffee, label: 'Menu' },
    { to: '/checkout', icon: ShoppingCart, label: 'Checkout' },
    { to: '/orders', icon: Receipt, label: 'Orders' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/70 backdrop-blur-xl rounded-t-3xl shadow-[0_-4px_20px_rgba(26,28,28,0.06)]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-300 rounded-2xl",
              isActive 
                ? "bg-primary text-on-primary" 
                : "text-secondary hover:opacity-80"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-body text-[11px] font-semibold tracking-wider uppercase mt-1">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
