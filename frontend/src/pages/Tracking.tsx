import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Check, Coffee, ShoppingBag, Stars, ChevronRight, Receipt, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { getTableId } from '../lib/table';
import { Feedback, Order } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface FeedbackResponse {
  feedback: Feedback | null;
}

interface SubmitFeedbackResponse {
  message: string;
  feedback: Feedback;
}

export default function Tracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
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
        console.error(err);
        setError('Failed to load your latest order');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();

    const interval = setInterval(() => {
      fetchLatestOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [location.search]);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!order?._id || !customer) {
        setFeedback(null);
        setRating(0);
        setComment('');
        return;
      }

      try {
        setReviewError('');
        setReviewMessage('');
        const res = await API.get<FeedbackResponse>(`/feedback/order/${order._id}`);
        const existingFeedback = res.data.feedback;

        setFeedback(existingFeedback);
        setRating(existingFeedback?.rating || 0);
        setComment(existingFeedback?.comment || '');
      } catch (err: any) {
        console.error(err);
        setReviewError(err?.response?.data?.message || 'Failed to load your review');
      }
    };

    loadFeedback();
  }, [customer, order?._id]);

  const submitReview = async () => {
    if (!order?._id) {
      setReviewError('Place an order before leaving a review.');
      return;
    }

    if (!customer) {
      navigate('/login?returnTo=/orders');
      return;
    }

    if (rating < 1 || rating > 5) {
      setReviewError('Choose a star rating before submitting.');
      return;
    }

    try {
      setSavingReview(true);
      setReviewError('');
      setReviewMessage('');

      const res = await API.post<SubmitFeedbackResponse>('/feedback', {
        orderId: order._id,
        rating,
        comment,
      });

      setFeedback(res.data.feedback);
      setReviewMessage(feedback ? 'Review updated. Thank you.' : 'Review submitted. Thank you.');
    } catch (err: any) {
      console.error(err);
      setReviewError(err?.response?.data?.message || 'Failed to submit your review');
    } finally {
      setSavingReview(false);
    }
  };

  // Explicit stages per philosophy
  const isPending = order?.status === 'pending';
  const isPreparing = order?.status === 'preparing';
  const isReady = order?.status === 'ready';
  const isCompleted = order?.status === 'completed';

  const hasStarted = !!order;
  const hasPreparing = isPreparing || isReady || isCompleted;
  const hasReady = isReady || isCompleted;

  const currentDisplayStatus = isReady ? 'Ready for Pickup' 
    : isPreparing ? 'Preparing' 
    : isPending ? 'Pending'
    : isCompleted ? 'Completed'
    : 'Loading...';
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
              {loading ? 'Loading...' : currentDisplayStatus}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {order?.estimatedTime ? `Estimated arrival: ${order.estimatedTime}` : 'Real-time kitchen updates'}
            </p>
          </div>

          <div className="mt-10 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-container-high rounded-full" />
            <div 
              className="absolute left-4 top-0 w-0.5 bg-primary rounded-full transition-all duration-700" 
              style={{ height: hasReady ? '100%' : hasPreparing ? '50%' : '15%' }}
            />
            
            <div className="space-y-10 relative">
              <div className={cn("flex items-center gap-6", !hasStarted && "opacity-40")}>
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-colors",
                  hasStarted ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                )}>
                  {isPending && <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />}
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-headline font-bold", hasStarted ? "text-primary" : "text-on-surface")}>Pending</span>
                  <span className="text-xs text-on-surface-variant">
                    {hasStarted ? order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Order received' : 'Waiting for order'}
                  </span>
                </div>
              </div>

              <div className={cn("flex items-center gap-6", !hasPreparing && "opacity-40")}>
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-colors",
                  hasPreparing ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                )}>
                  {isPreparing && <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />}
                  <Coffee size={18} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-headline font-bold", isPreparing ? "text-primary" : "text-on-surface")}>Preparing</span>
                  <span className="text-xs text-on-surface-variant">Kitchen is working</span>
                </div>
              </div>

              <div className={cn("flex items-center gap-6", !hasReady && "opacity-40")}>
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-colors",
                  hasReady ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                )}>
                  {isReady && <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />}
                  <ShoppingBag size={18} />
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-headline font-bold", isReady ? "text-primary" : "text-on-surface")}>Ready</span>
                  <span className="text-xs text-on-surface-variant">Ready for pickup</span>
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
            <h3 className="font-headline text-xl font-bold">
              {feedback ? 'Your review' : "How's your experience?"}
            </h3>
            <p className="text-sm text-on-surface-variant px-12">
              {order
                ? 'Your feedback helps us brew the perfect cup every time.'
                : 'Place an order first, then come back here to review it.'}
            </p>
          </div>
          
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={!order}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container transition-all active:scale-90 disabled:opacity-40"
                aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
              >
                <Star
                  size={32}
                  className={cn(
                    "text-primary transition-colors",
                    star <= rating ? "fill-primary" : "fill-transparent"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <textarea 
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={!order}
              className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/40 min-h-[120px] transition-all outline-none resize-none"
              placeholder="Tell us about your coffee..."
            />

            {reviewError && (
              <p className="rounded-2xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                {reviewError}
              </p>
            )}

            {reviewMessage && (
              <p className="rounded-2xl bg-green-50 border border-green-100 p-3 text-sm text-green-700">
                {reviewMessage}
              </p>
            )}

            {!customer ? (
              <button
                type="button"
                onClick={() => navigate('/login?returnTo=/orders')}
                className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                Login to Review
              </button>
            ) : (
              <button
                type="button"
                onClick={submitReview}
                disabled={!order || rating === 0 || savingReview}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
              >
                {savingReview ? 'Saving Review...' : feedback ? 'Update Review' : 'Submit Review'}
              </button>
            )}

            {feedback?.updatedAt && (
              <p className="text-xs text-on-surface-variant">
                Last saved {new Date(feedback.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
