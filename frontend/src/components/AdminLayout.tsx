import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Bell, RotateCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../lib/api';

interface ActiveOrderNotification {
  id: string;
  orderId: string;
  tableId?: number | null;
  createdAt: string;
  receivedAt: string;
}

interface ActiveOrderPayload {
  _id: string;
  tableId?: number;
  createdAt: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
}

interface StoredNotificationState {
  hasInitialized: boolean;
  notifications: ActiveOrderNotification[];
  seenOrderIds: string[];
}

const NOTIFICATION_POLL_MS = 5000;
const TOAST_AUTO_HIDE_MS = 6000;

const buildStorageKey = (scopeId: string) => `admin-order-notifications:${scopeId}`;

const readStoredState = (storageKey: string): StoredNotificationState => {
  if (typeof window === 'undefined') {
    return { hasInitialized: false, notifications: [], seenOrderIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { hasInitialized: false, notifications: [], seenOrderIds: [] };
    }

    const parsed = JSON.parse(raw) as Partial<StoredNotificationState>;
    return {
      hasInitialized: Boolean(parsed.hasInitialized),
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      seenOrderIds: Array.isArray(parsed.seenOrderIds) ? parsed.seenOrderIds : [],
    };
  } catch {
    return { hasInitialized: false, notifications: [], seenOrderIds: [] };
  }
};

const mergeUniqueIds = (currentIds: string[], nextIds: string[]) =>
  Array.from(new Set([...currentIds, ...nextIds.filter(Boolean)]));

const formatNotificationTime = (dateValue: string) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Just now';
  }

  return parsedDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isSuperadmin = user?.role === "superadmin";
  const scopeId = user?.restaurantId || user?._id || 'default';
  const storageKey = buildStorageKey(scopeId);
  const isOrdersRoute = location.pathname.startsWith('/admin/orders');
  const isPosRoute = location.pathname.startsWith('/admin/pos');
  const [notifications, setNotifications] = useState<ActiveOrderNotification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<ActiveOrderNotification[]>([]);
  const [seenOrderIds, setSeenOrderIds] = useState<string[]>([]);
  const [hasInitializedNotifications, setHasInitializedNotifications] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutsRef = useRef<Record<string, number>>({});
  const seenOrderIdsRef = useRef<string[]>([]);
  const hasInitializedNotificationsRef = useRef(false);

  useEffect(() => {
    seenOrderIdsRef.current = seenOrderIds;
  }, [seenOrderIds]);

  useEffect(() => {
    hasInitializedNotificationsRef.current = hasInitializedNotifications;
  }, [hasInitializedNotifications]);

  useEffect(() => {
    if (isSuperadmin) {
      setNotifications([]);
      setToastNotifications([]);
      setSeenOrderIds([]);
      setHasInitializedNotifications(false);
      return;
    }

    const storedState = readStoredState(storageKey);
    setNotifications(storedState.notifications);
    setToastNotifications([]);
    setSeenOrderIds(storedState.seenOrderIds);
    setHasInitializedNotifications(storedState.hasInitialized);
  }, [isSuperadmin, storageKey]);

  useEffect(() => {
    if (isSuperadmin || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        hasInitialized: hasInitializedNotifications,
        notifications,
        seenOrderIds,
      } satisfies StoredNotificationState)
    );
  }, [hasInitializedNotifications, isSuperadmin, notifications, seenOrderIds, storageKey]);

  useEffect(() => {
    return () => {
      Object.values(toastTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      toastTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    toastNotifications.forEach((notification) => {
      if (toastTimeoutsRef.current[notification.id]) {
        return;
      }

      toastTimeoutsRef.current[notification.id] = window.setTimeout(() => {
        setToastNotifications((current) => current.filter((item) => item.id !== notification.id));
        delete toastTimeoutsRef.current[notification.id];
      }, TOAST_AUTO_HIDE_MS);
    });
  }, [toastNotifications]);

  useEffect(() => {
    if (!isNotificationPanelOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isNotificationPanelOpen]);

  useEffect(() => {
    if (!isPosRoute) {
      return;
    }

    Object.values(toastTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    toastTimeoutsRef.current = {};
    setToastNotifications([]);
    setNotifications([]);
    setIsNotificationPanelOpen(false);
  }, [isPosRoute]);

  useEffect(() => {
    if (isSuperadmin) {
      return;
    }

    let cancelled = false;

    const syncOrderNotifications = async () => {
      try {
        const res = await API.get<ActiveOrderPayload[]>('/admin/orders/active');
        if (cancelled) {
          return;
        }

        const pendingOrders = (Array.isArray(res.data) ? res.data : []).filter((order) => order.status === 'pending');
        const pendingOrderIds = pendingOrders.map((order) => order._id);

        if (isOrdersRoute || isPosRoute) {
          setSeenOrderIds((current) => mergeUniqueIds(current, pendingOrderIds));
          if (!hasInitializedNotificationsRef.current) {
            setHasInitializedNotifications(true);
          }
          return;
        }

        if (!hasInitializedNotificationsRef.current) {
          setSeenOrderIds((current) => mergeUniqueIds(current, pendingOrderIds));
          setHasInitializedNotifications(true);
          return;
        }

        const nextOrders = pendingOrders.filter((order) => !seenOrderIdsRef.current.includes(order._id));

        if (nextOrders.length === 0) {
          return;
        }

        const nextNotifications = nextOrders.map((order) => ({
          id: order._id,
          orderId: order._id,
          tableId: order.tableId ?? null,
          createdAt: order.createdAt,
          receivedAt: new Date().toISOString(),
        }));

        setSeenOrderIds((current) => mergeUniqueIds(current, nextOrders.map((order) => order._id)));
        setNotifications((current) => [...nextNotifications, ...current.filter((item) => !nextOrders.some((order) => order._id === item.id))]);
        setToastNotifications((current) => [...nextNotifications, ...current.filter((item) => !nextOrders.some((order) => order._id === item.id))].slice(0, 3));
      } catch (error) {
        console.error('Failed to sync admin notifications', error);
      }
    };

    void syncOrderNotifications();
    const intervalId = window.setInterval(() => {
      void syncOrderNotifications();
    }, NOTIFICATION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isOrdersRoute, isPosRoute, isSuperadmin]);

  const dismissNotification = (notificationId: string) => {
    if (toastTimeoutsRef.current[notificationId]) {
      window.clearTimeout(toastTimeoutsRef.current[notificationId]);
      delete toastTimeoutsRef.current[notificationId];
    }

    setNotifications((current) => current.filter((item) => item.id !== notificationId));
    setToastNotifications((current) => current.filter((item) => item.id !== notificationId));
  };

  const unreadNotificationCount = notifications.length;
  const notificationItems = [...notifications].sort(
    (left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 right-0 w-full h-16 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 z-40 shadow-sm border-b border-outline/5">
          <div className="flex-1" />
          
          <div className="flex items-center gap-4 relative" ref={panelRef}>
            {!isSuperadmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsNotificationPanelOpen((current) => !current)}
                  className="hover:bg-surface-container rounded-full p-2 transition-colors relative"
                  aria-label="Open notifications"
                >
                  <Bell size={20} className="text-primary" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="hover:bg-surface-container rounded-full p-2 transition-colors"
                  aria-label="Refresh page"
                >
                  <RotateCw size={20} className="text-primary" />
                </button>
              </>
            )}
            {isNotificationPanelOpen && !isSuperadmin && (
              <div className="absolute right-0 top-14 z-50 w-[22rem] rounded-3xl border border-outline/10 bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-headline font-extrabold text-primary">Order Notifications</h3>
                    <p className="text-[11px] text-secondary">Undismissed live order alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationPanelOpen(false)}
                    className="rounded-full p-2 text-secondary transition-colors hover:bg-surface-container hover:text-primary"
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {notificationItems.length === 0 ? (
                    <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">
                      No pending notifications right now.
                    </div>
                  ) : (
                    notificationItems.map((notification) => (
                      <div key={notification.id} className="rounded-2xl border border-outline/10 bg-surface-container-low/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-on-surface">
                              New order from {notification.tableId ? `Table ${notification.tableId}` : 'your cafe'}
                            </p>
                            <p className="mt-1 text-xs text-secondary">
                              Order #{notification.orderId.slice(-6).toUpperCase()} came in at {formatNotificationTime(notification.receivedAt)}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => dismissNotification(notification.id)}
                            className="rounded-full p-2 text-secondary transition-colors hover:bg-white hover:text-red-600"
                            aria-label={`Dismiss notification for order ${notification.orderId}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <div className="h-8 w-px bg-outline/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface leading-none">
                  {user?.restaurantName || user?.name || (isSuperadmin ? "Platform Superadmin" : "Cafe Owner")}
                </p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
                  {isSuperadmin ? "Superadmin Access" : user?.role === "admin" ? "Admin Access" : "Owner Access"}
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

        {!isSuperadmin && toastNotifications.length > 0 && (
          <div className="pointer-events-none fixed right-8 top-24 z-[70] space-y-3">
            {toastNotifications.map((notification) => (
              <div
                key={notification.id}
                className="pointer-events-auto w-80 rounded-3xl border border-outline/10 bg-white p-4 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-headline font-extrabold text-primary">New Order Received</p>
                    <p className="mt-1 text-sm font-semibold text-on-surface">
                      {notification.tableId ? `Table ${notification.tableId}` : 'A customer'} just placed an order.
                    </p>
                    <p className="mt-1 text-xs text-secondary">
                      Order #{notification.orderId.slice(-6).toUpperCase()} at {formatNotificationTime(notification.receivedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissNotification(notification.id)}
                    className="rounded-full border border-outline/10 px-3 py-1 text-xs font-bold text-secondary transition-colors hover:bg-surface-container hover:text-red-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
