import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bell, Check, Coffee, ShoppingBag, Stars, ChevronRight, Receipt, Star, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { getOrCreateTenantSessionId, getPublicRestaurantId, getPublicTableId } from '../lib/tenant';
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

const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'] as const;

const formatClockTime = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toStatusLabel = (status?: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready for Pickup';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'No Active Order';
  }
};

export default function Tracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedOnceRef = useRef(false);

  const selectedOrder = useMemo(
    () => orders.find((item) => item._id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const activeOrders = useMemo(
    () => orders.filter((item) => ACTIVE_STATUSES.includes(item.status as typeof ACTIVE_STATUSES[number])),
    [orders]
  );

  useEffect(() => {
    const boundRestaurantId = getPublicRestaurantId();
    const boundTableId = getPublicTableId();
    const boundSessionId = getOrCreateTenantSessionId();

    const fetchOrders = async () => {
      if (!boundRestaurantId || !boundTableId) {
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        setError('Open a valid restaurant QR link to load your order status');
        return;
      }

      try {
        setRefreshing(true);
        if (!hasLoadedOnceRef.current) {
          setLoading(true);
        }
        setError('');

        const params: Record<string, string> = { activeOnly: 'true' };
        if (boundSessionId) {
          params.sessionId = boundSessionId;
        }

        const res = await API.get<Order[]>('/orders/table', { params });
        const nextOrders = (res.data || []).filter((item) =>
          ACTIVE_STATUSES.includes(item.status as typeof ACTIVE_STATUSES[number])
        );
        setOrders(nextOrders);
        hasLoadedOnceRef.current = true;
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to refresh your orders');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [location.hash, location.search]);

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      return;
    }

    const currentStillExists = selectedOrderId && orders.some((item) => item._id === selectedOrderId);
    if (currentStillExists) {
      return;
    }

    const nextSelection = activeOrders[0] || null;
    setSelectedOrderId(nextSelection?._id || null);
  }, [orders, activeOrders, selectedOrderId]);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!selectedOrder?._id || !customer) {
        setFeedback(null);
        setRating(0);
        setComment('');
        return;
      }

      try {
        setReviewError('');
        setReviewMessage('');
        const res = await API.get<FeedbackResponse>(`/feedback/order/${selectedOrder._id}`);
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
  }, [customer, selectedOrder?._id]);

  const submitReview = async () => {
    if (!selectedOrder?._id) {
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
        orderId: selectedOrder._id,
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

  const isPending = selectedOrder?.status === 'pending';
  const isPreparing = selectedOrder?.status === 'preparing';
  const isReady = selectedOrder?.status === 'ready';
  const isCompleted = selectedOrder?.status === 'completed';
  const isCancelled = selectedOrder?.status === 'cancelled';

  const hasStarted = !!selectedOrder;
  const hasPreparing = !isCancelled && (isPreparing || isReady || isCompleted);
  const hasReady = !isCancelled && (isReady || isCompleted);

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

      <main className="pt-24 px-6 max-w-md mx-auto space-y-6">
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-outline/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">Your Orders</p>
              <h2 className="font-headline text-xl font-extrabold text-primary">
                {`${activeOrders.length} active order${activeOrders.length === 1 ? '' : 's'}`}
              </h2>
            </div>
            <div className="rounded-2xl bg-surface-container-low px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Active</p>
              <p className="font-headline text-lg font-extrabold text-on-surface">{activeOrders.length}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {hasLoadedOnceRef.current && activeOrders.length === 0 && (
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
                No pending, preparing, or ready orders right now.
              </div>
            )}

            {activeOrders.map((item) => {
              const selected = item._id === selectedOrder?._id;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedOrderId(item._id)}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-outline/10 bg-white hover:bg-surface-container-low'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base font-bold text-on-surface">
                        Order #{item.orderNumber ?? item._id.slice(-4).toUpperCase()}
                      </p>
                      <p className="text-xs text-secondary">
                        Placed {formatDateTime(item.createdAt)}
                      </p>
                      {item.completedAt && (
                        <p className="text-xs text-secondary">
                          Completed {formatDateTime(item.completedAt)}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                        item.status === 'cancelled'
                          ? 'bg-red-50 text-red-600'
                          : item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-surface-container text-primary'
                      )}
                    >
                      {toStatusLabel(item.status)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Coffee size={96} />
          </div>
          <div className="space-y-1">
            <span className="font-body text-[11px] font-semibold tracking-wider uppercase text-secondary">Current Status</span>
            <h2 className={cn('font-headline text-3xl font-extrabold', isCancelled ? 'text-red-600' : 'text-primary')}>
              {toStatusLabel(selectedOrder?.status)}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {isCancelled
                ? 'This order was cancelled and will not be prepared.'
                : isCompleted && selectedOrder?.completedAt
                  ? `Completed at ${formatDateTime(selectedOrder.completedAt)}`
                  : selectedOrder?.estimatedTime
                    ? `Estimated arrival: ${selectedOrder.estimatedTime}`
                    : 'Real-time kitchen updates'}
            </p>
          </div>

          {selectedOrder && (
            <div className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Placed at {formatDateTime(selectedOrder.createdAt)}</span>
                {selectedOrder.completedAt && <span>Completed at {formatDateTime(selectedOrder.completedAt)}</span>}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle size={18} />
              <span>The kitchen marked this order as cancelled.</span>
            </div>
          )}

          <div className="mt-10 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-container-high rounded-full" />
            <div
              className="absolute left-4 top-0 w-0.5 bg-primary rounded-full transition-all duration-700"
              style={{ height: hasReady ? '100%' : hasPreparing ? '50%' : '15%' }}
            />

            <div className="space-y-10 relative">
              <div className={cn('flex items-center gap-6', !hasStarted && 'opacity-40')}>
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-colors',
                  hasStarted ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                )}>
                  {isPending && <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />}
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className={cn('font-headline font-bold', hasStarted ? 'text-primary' : 'text-on-surface')}>Pending</span>
                  <span className="text-xs text-on-surface-variant">
                    {hasStarted ? formatClockTime(selectedOrder?.createdAt) || 'Order received' : 'Waiting for order'}
                  </span>
                </div>
              </div>

              <div className={cn('flex items-center gap-6', !hasPreparing && 'opacity-40')}>
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-colors',
                  hasPreparing ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                )}>
                  {isPreparing && <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />}
                  <Coffee size={18} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className={cn('font-headline font-bold', isPreparing ? 'text-primary' : 'text-on-surface')}>Preparing</span>
                  <span className="text-xs text-on-surface-variant">Kitchen is working</span>
                </div>
              </div>

              <div className={cn('flex items-center gap-6', !hasReady && 'opacity-40')}>
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-colors',
                  hasReady ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                )}>
                  {isReady && <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />}
                  <ShoppingBag size={18} />
                </div>
                <div className="flex flex-col">
                  <span className={cn('font-headline font-bold', isReady || isCompleted ? 'text-primary' : 'text-on-surface')}>
                    {isCompleted ? 'Completed' : 'Ready'}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {isCompleted ? `Finished at ${formatClockTime(selectedOrder?.completedAt) || ''}` : 'Ready for pickup'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary-container rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-on-primary-container rounded-xl flex items-center justify-center text-primary-container">
              <Stars size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-primary-container">
                {selectedOrder ? `Order total ₹${selectedOrder.grandTotal.toFixed(2)}` : 'No order selected'}
              </h3>
              <p className="text-xs text-on-primary-container/80">
                {activeOrders.length > 1 ? `${activeOrders.length} active orders at the same time` : 'Each active order keeps its own timeline'}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-on-primary-container/40" />
        </section>

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
              <span className="font-body text-[10px] uppercase tracking-widest text-on-secondary-container/70 mb-1">Selected Order</span>
              <p className="font-headline font-bold text-on-secondary-container leading-tight">
                {selectedOrder?.items?.length
                  ? selectedOrder.items.map((item) => `${item.name} x${item.quantity}`).join(', ')
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

        <section className="space-y-6 pt-4 text-center">
          <div className="space-y-1">
            <h3 className="font-headline text-xl font-bold">
              {feedback ? 'Your review' : "How's your experience?"}
            </h3>
            <p className="text-sm text-on-surface-variant px-12">
              {selectedOrder
                ? 'Each order can be reviewed separately, so older completed orders stay easy to identify.'
                : 'Place an order first, then come back here to review it.'}
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={!selectedOrder}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container transition-all active:scale-90 disabled:opacity-40"
                aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
              >
                <Star
                  size={32}
                  className={cn('text-primary transition-colors', star <= rating ? 'fill-primary' : 'fill-transparent')}
                />
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={!selectedOrder}
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
                disabled={!selectedOrder || rating === 0 || savingReview}
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
