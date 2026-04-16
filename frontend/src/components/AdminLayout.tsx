import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Search, Bell, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 right-0 w-full h-16 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 z-40 shadow-sm border-b border-outline/5">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input 
                type="text"
                placeholder="Search everything..."
                className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="hover:bg-surface-container rounded-full p-2 transition-colors relative">
              <Bell size={20} className="text-primary" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="hover:bg-surface-container rounded-full p-2 transition-colors">
              <History size={20} className="text-primary" />
            </button>
            <div className="h-8 w-px bg-outline/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface leading-none">
                  {user?.restaurantName || user?.name || "Cafe Owner"}
                </p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
                  {user?.role === "superadmin" ? "Superadmin Access" : "Owner Access"}
                </p>
              </div>
              <img 
                src={user?.restaurantLogo || user?.avatar || "https://placehold.co/100x100/png"} 
                alt="Manager" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>
        
        <div className="flex-1 px-8 pb-8 pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
