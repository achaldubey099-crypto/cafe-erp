import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

import API from "../lib/api";
import { cn } from "../lib/utils";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

type UpdatableStatus = OrderStatus;

interface OrderItem {
  itemId: number;
  name?: string;
  quantity: number;
  price: number;
}

interface AdminOrder {
  _id: string;
  tableId: number;
  items: OrderItem[];
  status: OrderStatus;
  grandTotal: number;
  orderType?: "dine-in" | "takeaway";
  createdAt: string;
}

const FILTERS: Array<"all" | OrderStatus> = ["all", "pending", "preparing", "ready", "completed", "cancelled"];
const UPDATABLE_STATUSES: UpdatableStatus[] = ["pending", "preparing", "ready", "completed", "cancelled"];

const toTitle = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

const formatTimeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hrs ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default function AdminOrders() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const statusStyles: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    preparing: "bg-blue-100 text-blue-700 border-blue-200",
    ready: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-[#808000]/15 text-[#556b2f] border-[#808000]/30",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcons: Record<OrderStatus, JSX.Element> = {
    pending: <Clock size={14} />,
    preparing: <AlertCircle size={14} />,
    ready: <AlertCircle size={14} />,
    completed: <CheckCircle2 size={14} />,
    cancelled: <XCircle size={14} />,
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get<AdminOrder[]>("/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const visibleOrders = useMemo(() => {
    const base = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    const term = search.trim().toLowerCase();

    if (!term) {
      return base;
    }

    return base.filter((order) => {
      const orderIdMatch = order._id.toLowerCase().includes(term);
      const tableMatch = `table ${order.tableId}`.includes(term);
      const itemMatch = order.items.some((item) => (item.name || "").toLowerCase().includes(term));
      return orderIdMatch || tableMatch || itemMatch;
    });
  }, [orders, filter, search]);

  const handleStatusUpdate = async (orderId: string, status: UpdatableStatus) => {
    try {
      setError("");
      const res = await API.put<{ order: AdminOrder }>(`/admin-orders/${orderId}/status`, { status });
      const updated = res.data.order;
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, ...updated } : o)));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update order status");
    }
  };

  const exportOrdersToCsv = () => {
    const headers = [
      "orderId",
      "tableId",
      "status",
      "orderType",
      "grandTotal",
      "createdAt",
      "items",
    ];

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows = visibleOrders.map((order) => {
      const items = order.items
        .map((item) => `${item.name || `Item ${item.itemId}`} x${item.quantity}`)
        .join(" | ");

      return [
        order._id,
        order.tableId,
        order.status,
        order.orderType || "dine-in",
        order.grandTotal.toFixed(2),
        order.createdAt,
        items,
      ].map(escapeCsv).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Order Management</h2>
          <p className="text-secondary font-medium mt-1">All orders from `api/orders` are visible here.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportOrdersToCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline/10 rounded-xl text-sm font-bold text-secondary hover:bg-surface-container transition-all"
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-outline/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                filter === f
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
              )}
            >
              {toTitle(f)}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order, table, item..."
            className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-3xl shadow-sm border border-outline/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Table</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Items</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {!loading && visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-secondary">
                    No orders found.
                  </td>
                </tr>
              )}

              {visibleOrders.map((order) => {
                const canUpdate = order.status === "pending" || order.status === "preparing" || order.status === "ready";

                return (
                  <tr key={order._id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-xs text-primary">#{order._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm text-on-surface">Table {order.tableId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-secondary line-clamp-1 max-w-[280px]">
                        {order.items.map((item) => `${item.name || `Item ${item.itemId}`} x${item.quantity}`).join(", ")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container rounded-lg text-secondary uppercase tracking-tighter">
                        {order.orderType || "dine-in"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-headline font-extrabold text-on-surface">₹{order.grandTotal.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                          statusStyles[order.status]
                        )}
                      >
                        {statusIcons[order.status]}
                        {toTitle(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-outline font-medium">{formatTimeAgo(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {canUpdate ? (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value as UpdatableStatus)}
                          className="text-xs bg-surface-container-low border border-outline/10 rounded-lg px-2 py-1 outline-none"
                        >
                          {UPDATABLE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {toTitle(status)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-bold text-secondary uppercase tracking-wide">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-outline/5 flex justify-between items-center bg-surface-container-low/20">
          <p className="text-xs text-secondary font-medium">
            {loading ? "Loading orders..." : `Showing ${visibleOrders.length} order(s)`}
          </p>
        </div>
      </div>
    </div>
  );
}
