import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Check, Coffee, ShoppingBag, Stars, ChevronRight, Receipt, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { getTableId } from '../lib/table';
import { Order } from '../types';
import { cn } from '../lib/utils';

export default function Tracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tableId = new URLSearchParams(location.search).get('tableId') || String(getTableId());

    const fetchLatestOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await API.get<Order>('/orders/latest', { params: { tableId } });
        setOrder(res.data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setOrder(null);
          return;
        }
        setError('Failed to load your latest order');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, [location.search]);

  const statusLabel = order?.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Preparing Order';
  const latestItems = order?.items || [];

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Order Tracking</h1>
          <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95">
            <Bell size={20} className="text-primary" />
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-md mx-auto space-y-8">
        {/* Status Card */}
        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Coffee size={96} />
          </div>
          <div className="space-y-1">
            <span className="font-body text-[11px] font-semibold tracking-wider uppercase text-secondary">Current Status</span>
            <h2 className="font-headline text-3xl font-extrabold text-primary">
              {loading ? 'Loading...' : statusLabel}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {order?.estimatedTime ? `Estimated arrival: ${order.estimatedTime}` : 'Estimated arrival will appear here'}
            </p>
          </div>

          <div className="mt-10 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-container-high rounded-full" />
            <div className="absolute left-4 top-0 h-[66%] w-0.5 bg-primary rounded-full transition-all duration-700" />
            
            <div className="space-y-10 relative">
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary z-10">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-bold text-on-surface">Order Received</span>
                  <span className="text-xs text-on-surface-variant">{order?.createdAt || 'Just now'}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary z-10">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                  <Coffee size={18} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-bold text-primary">{statusLabel}</span>
                  <span className="text-xs text-on-surface-variant">In progress</span>
                </div>
              </div>

              <div className="flex items-center gap-6 opacity-40">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant z-10">
                  <ShoppingBag size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-bold text-on-surface">Ready for Pickup</span>
                  <span className="text-xs text-on-surface-variant">Waiting...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Points Banner */}
        <section className="bg-primary-container rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-on-primary-container rounded-xl flex items-center justify-center text-primary-container">
              <Stars size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-primary-container">
                {order ? `Order total ₹${order.grandTotal.toFixed(2)}` : 'No active order found'}
              </h3>
              <p className="text-xs text-on-primary-container/80">Live status from your latest backend order</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-on-primary-container/40" />
        </section>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl overflow-hidden aspect-[4/5]">
            <img 
              src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80" 
              alt="Order" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-secondary-container rounded-3xl p-6 flex-1 flex flex-col justify-end">
              <span className="font-body text-[10px] uppercase tracking-widest text-on-secondary-container/70 mb-1">Your Order</span>
              <p className="font-headline font-bold text-on-secondary-container leading-tight">
                {latestItems.length > 0
                  ? latestItems.map((item) => `${item.name} x${item.quantity}`).join(', ')
                  : 'No order items yet'}
              </p>
            </div>
            <div className="bg-surface-container rounded-3xl p-6 h-24 flex items-center justify-center">
              <Receipt size={32} className="text-primary/30" />
            </div>
          </div>
        </div>

        {error && (
          <section className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
            {error}
          </section>
        )}

        {/* Feedback */}
        <section className="space-y-6 pt-4 text-center">
          <div className="space-y-1">
            <h3 className="font-headline text-xl font-bold">How's your experience?</h3>
            <p className="text-sm text-on-surface-variant px-12">Your feedback helps us brew the perfect cup every time.</p>
          </div>
          
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container transition-all active:scale-90">
                <Star size={32} className={cn("text-primary", star === 5 ? "text-outline-variant" : "fill-primary")} />
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <textarea 
              className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/40 min-h-[120px] transition-all outline-none resize-none"
              placeholder="Tell us about your coffee..."
            />
            <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform">
              Submit Feedback
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
