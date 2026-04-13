import React from 'react';
import { ArrowLeft, Edit2, Stars, ChevronRight, RotateCcw, Apple, Settings, LogOut } from 'lucide-react';
import { PAST_ORDERS } from '../constants';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-sm flex items-center px-4 h-16">
        <div className="flex items-center w-full justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Profile</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mt-20 px-5 max-w-md mx-auto space-y-8">
        {/* User Info */}
        <section className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary to-primary-container">
              <img 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-surface"
                referrerPolicy="no-referrer"
              />
            </div>
            <button className="absolute bottom-0 right-0 bg-primary text-on-primary p-2 rounded-full shadow-lg active:scale-90 transition-transform">
              <Edit2 size={14} />
            </button>
          </div>
          <div className="mt-4">
            <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Alex Rivera</h2>
            <p className="font-body text-on-surface-variant text-sm mt-1">+1 555-0123 | alex.r@email.com</p>
          </div>
          <button className="mt-4 px-6 py-2 rounded-xl bg-surface-container-high text-primary font-semibold text-sm hover:bg-surface-container-highest transition-colors active:scale-95">
            Edit Profile
          </button>
        </section>

        {/* Loyalty Card */}
        <section className="bg-primary text-on-primary rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest text-on-primary/60 font-bold">Current Balance</p>
                <h3 className="font-headline font-bold text-3xl mt-1">240 Points Earned</h3>
              </div>
              <Stars size={36} className="text-on-primary-container fill-current" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-on-primary/90 font-medium">
                <span>Progress</span>
                <span>60 points away from a free pastry</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-on-primary-container rounded-full w-[80%]" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="text-on-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                View Rewards
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Favorites */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-lg text-on-surface">Favorites</h3>
            <button className="text-primary text-sm font-medium">See all</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Oat Milk Shakerato', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80' },
              { name: 'Butter Croissant', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80' }
            ].map((fav, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                <div className="w-full aspect-square rounded-xl overflow-hidden">
                  <img src={fav.img} alt={fav.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <p className="font-headline font-bold text-sm text-on-surface leading-tight">{fav.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Past Orders */}
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-lg text-on-surface">Past Orders</h3>
          <div className="space-y-3">
            {PAST_ORDERS.map((order) => (
              <div key={order._id} className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-3 hover:bg-surface-container transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-headline font-extrabold text-sm text-on-surface">Order #{order._id}</p>
                    <p className="font-body text-xs text-on-surface-variant">{order.createdAt}</p>
                  </div>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="font-body text-sm text-on-surface">{order.items.join(', ')}</p>
                    <p className="font-headline font-bold text-primary">${order.total.toFixed(2)}</p>
                  </div>
                  <button className="bg-primary text-on-primary p-2 rounded-xl active:scale-90 transition-all">
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="space-y-2">
          <div className="bg-surface-container-highest/30 p-4 rounded-2xl flex items-center justify-between group cursor-pointer active:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Apple size={20} className="text-secondary" />
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Default Payment</p>
                <p className="font-body font-semibold text-on-surface">Apple Pay</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </div>
          
          <div className="bg-surface-container-highest/30 p-4 rounded-2xl flex items-center justify-between group cursor-pointer active:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Settings size={20} className="text-secondary" />
              </div>
              <p className="font-body font-semibold text-on-surface">Account Settings</p>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </div>
        </section>

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-500/20 text-red-500 font-bold tracking-tight hover:bg-red-500/5 active:scale-[0.98] transition-all">
          <LogOut size={20} />
          Logout
        </button>
      </main>
    </div>
  );
}
