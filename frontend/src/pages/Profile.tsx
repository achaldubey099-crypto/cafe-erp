import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Stars, ChevronRight, RotateCcw, Apple, Settings, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import API from '../lib/api';
import { getTableId } from '../lib/table';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { getCustomerMenuPath } from '../lib/tenant';

interface ProfileResponse {
  user: {
    name: string;
    tableId: number | null;
  };
  points: number;
  totalSpent: number;
  pastOrders: Order[];
}

interface FavoriteResponse {
  _id: string;
  itemId: {
    _id: string;
    name: string;
    price?: number;
    image?: string;
    category?: string;
  } | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const menuPath = getCustomerMenuPath();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { customer, logoutCustomer } = useAuth();
  const isLoggedIn = !!customer;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        if (isLoggedIn) {
          // Logged-in: fetch favorites and past orders by userId
          const [ordersRes, favoritesRes] = await Promise.all([
            API.get<Order[]>('/orders', { params: { userId: customer._id } }),
            API.get<FavoriteResponse[]>('/favorites', { params: { userId: customer._id } }),
          ]);

          const pastOrders = ordersRes.data || [];
          const totalSpent = pastOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
          const points = Math.floor(totalSpent * 0.1);
          const currentTableId = getTableId();

          setProfile({
            user: { name: customer.name || 'User', tableId: currentTableId },
            points,
            totalSpent,
            pastOrders,
          });

          setFavorites(favoritesRes.data || []);
        } else {
          // Guest: do not fetch user-specific data
          setProfile(null);
          setFavorites([]);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [customer]);

  const handleLogout = () => {
    logoutCustomer();
    navigate(menuPath);
  };

  const userName = isLoggedIn ? (customer.name || 'User') : (profile?.user?.name || 'Guest User');
  const tableId = profile?.user?.tableId ?? getTableId();
  const points = profile?.points ?? 0;
  const totalSpent = profile?.totalSpent ?? 0;
  const pastOrders = profile?.pastOrders || [];
  const progressWidth = `${Math.min(100, (points % 100) || 20)}%`;

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-sm flex items-center px-4 h-16">
        <div className="flex items-center w-full justify-between">
          <button
            onClick={() => navigate(menuPath)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Profile</h1>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-primary active:scale-95 transition-all"
            >
              <LogOut size={14} />
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/login?returnTo=/profile')}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary active:scale-95 transition-all"
            >
              <LogIn size={14} />
              Login
            </button>
          )}
        </div>
      </header>

      <main className="mt-20 px-5 max-w-md mx-auto space-y-8">
        {error && (
          <section className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
            {error}
          </section>
        )}

        {/* User Info */}
        <section className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary to-primary-container">
              <img
                src={customer?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-surface"
                referrerPolicy="no-referrer"
              />
            </div>
            {isLoggedIn && (
              <button className="absolute bottom-0 right-0 bg-primary text-on-primary p-2 rounded-full shadow-lg active:scale-90 transition-transform">
                <Edit2 size={14} />
              </button>
            )}
          </div>
          <div className="mt-4">
            <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
              {loading ? 'Loading...' : userName}
            </h2>
            <p className="font-body text-on-surface-variant text-sm mt-1">
              {tableId ? `Table #${tableId}` : 'Scan your table QR to bind this device'}
            </p>
          </div>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 px-6 py-3 rounded-lg bg-surface-container-high text-primary font-bold text-sm hover:bg-surface-container-highest transition-colors active:scale-95"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/login?returnTo=/profile')}
              className="mt-4 flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-bold text-sm active:scale-95 transition-transform"
            >
              <LogIn size={16} />
              Login with Google
            </button>
          )}
        </section>

        {/* Loyalty Card */}
        <section className="bg-primary text-on-primary rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest text-on-primary/60 font-bold">Current Balance</p>
                <h3 className="font-headline font-bold text-3xl mt-1">{points} Points Earned</h3>
              </div>
              <Stars size={36} className="text-on-primary-container fill-current" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-on-primary/90 font-medium">
                <span>Progress</span>
                <span>{totalSpent > 0 ? `₹${totalSpent.toFixed(2)} spent` : 'Place your first order to earn points'}</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-on-primary-container rounded-full" style={{ width: progressWidth }} />
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center gap-4">
              <p className="text-xs text-on-primary/80">Live data from your latest backend profile</p>
              <button className="text-on-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                View Rewards
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Favorites */}
        {isLoggedIn && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">Favorites</h3>
              <button className="text-primary text-sm font-medium">See all</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {loading && favorites.length === 0 ? (
                <div className="col-span-2 rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">Loading favorites...</div>
              ) : favorites.length > 0 ? (
                favorites.map((favorite) => {
                  const item = favorite.itemId;
                  if (!item) return null;

                  return (
                    <div key={favorite._id} className="bg-white p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-container p-3">
                        <img src={item.image || ''} alt={item.name} className="w-full h-full object-cover rounded-md shadow-sm" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="font-headline font-bold text-sm text-on-surface leading-tight">{item.name}</p>
                        {typeof item.price === 'number' && (
                          <p className="text-xs font-bold text-primary mt-1">₹{item.price}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">No favorites saved yet.</div>
              )}
            </div>
          </section>
        )}

        {/* Past Orders */}
        {isLoggedIn && (
          <section className="space-y-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">Past Orders</h3>
            <div className="space-y-3">
              {pastOrders.length > 0 ? (
                pastOrders.map((order) => (
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
                    <div className="flex justify-between items-end gap-4">
                      <div className="space-y-1">
                        <p className="font-body text-sm text-on-surface">
                          {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                        </p>
                        <p className="font-headline font-bold text-primary">₹{order.grandTotal.toFixed(2)}</p>
                      </div>
                      <button className="bg-primary text-on-primary p-2 rounded-xl active:scale-90 transition-all">
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">No past orders found for this table.</div>
              )}
            </div>
          </section>
        )}

        {/* Settings */}
        <section className="space-y-2">

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
        {isLoggedIn && (
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-500/20 text-red-500 font-bold tracking-tight hover:bg-red-500/5 active:scale-[0.98] transition-all">
            <LogOut size={20} />
            Logout
          </button>
        )}
      </main>
    </div>
  );
}
