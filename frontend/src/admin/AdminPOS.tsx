import React, { useEffect, useMemo, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

import API from "../lib/api";
import { cn } from "../lib/utils";
import { Product } from "../types";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type OngoingStatus = "pending" | "preparing" | "ready";

interface OrderItem {
  itemId: number;
  name?: string;
  price: number;
  quantity: number;
}

interface PosOrder {
  _id: string;
  tableId: number;
  items: OrderItem[];
  status: OrderStatus;
  grandTotal: number;
  createdAt: string;
}

const ONGOING_STATUSES: OngoingStatus[] = ["pending", "preparing", "ready"];

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  preparing: "bg-blue-100 text-blue-700 border-blue-200",
  ready: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-[#808000]/15 text-[#556b2f] border-[#808000]/30",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusIcon: Record<OrderStatus, JSX.Element> = {
  pending: <Clock size={14} />,
  preparing: <AlertCircle size={14} />,
  ready: <CheckCircle2 size={14} />,
  completed: <CheckCircle2 size={14} />,
  cancelled: <XCircle size={14} />,
};

const toTitle = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

export default function AdminPOS() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuByItemId = useMemo(() => {
    const map = new Map<number, Product>();
    menuItems.forEach((item, index) => {
      const fallbackId = index + 1;
      const idFromLegacy = Number(item.id);
      const numericId = Number.isNaN(idFromLegacy) ? fallbackId : idFromLegacy;
      map.set(numericId, item);
    });
    return map;
  }, [menuItems]);

  const loadPosData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersRes, menuRes] = await Promise.all([
        API.get<PosOrder[]>("/orders"),
        API.get<Product[]>("/menu"),
      ]);

      const ongoing = (ordersRes.data || []).filter((order) =>
        ONGOING_STATUSES.includes(order.status as OngoingStatus)
      );

      setOrders(ongoing);
      setMenuItems(menuRes.data || []);

      if (ongoing.length > 0) {
        const firstTable = [...new Set(ongoing.map((order) => order.tableId))].sort((a, b) => a - b)[0];
        setSelectedTable((prev) => prev ?? firstTable);
      } else {
        setSelectedTable(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load POS data");
      setOrders([]);
      setSelectedTable(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosData();
  }, []);

  const tables = useMemo(() => {
    const grouped = new Map<number, PosOrder[]>();
    orders.forEach((order) => {
      if (!grouped.has(order.tableId)) {
        grouped.set(order.tableId, []);
      }
      grouped.get(order.tableId)?.push(order);
    });

    return [...grouped.entries()]
        .map(([tableId, tableOrders]) => ({
          tableId,
          orders: tableOrders,
          status: (tableOrders.some((o) => o.status === "preparing")
            ? "preparing"
            : tableOrders.some((o) => o.status === "pending")
              ? "pending"
              : "ready") as OrderStatus,
        }))
      .sort((a, b) => a.tableId - b.tableId);
  }, [orders]);

  const selectedTableOrders = useMemo(
    () => orders.filter((order) => order.tableId === selectedTable),
    [orders, selectedTable]
  );

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await API.put(`/admin-orders/${orderId}/status`, { status });

      setOrders((prev) =>
        prev
          .map((order) => (order._id === orderId ? { ...order, status } : order))
          .filter((order) => ONGOING_STATUSES.includes(order.status as OngoingStatus))
      );

      if (status === "completed" || status === "cancelled") {
        setSelectedTable((current) => {
          if (!current) return current;

          const remainingForTable = orders.some(
            (order) =>
              order._id !== orderId &&
              order.tableId === current &&
              ONGOING_STATUSES.includes(order.status as OngoingStatus)
          );

          if (remainingForTable) return current;

          const nextTable = [...new Set(
            orders
              .filter((order) => order._id !== orderId && ONGOING_STATUSES.includes(order.status as OngoingStatus))
              .map((order) => order.tableId)
          )]
            .sort((a, b) => a - b)[0];

          return nextTable ?? null;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update order status in POS");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">POS Tables</h2>
          <p className="text-secondary font-medium mt-1">Only ongoing orders (pending, preparing, ready) are shown here.</p>
        </div>
        <button
          onClick={loadPosData}
          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-outline/5 shadow-sm p-4">
          <h3 className="text-sm uppercase tracking-widest font-black text-secondary px-2 mb-3">Tables</h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {!loading && tables.length === 0 && (
              <div className="text-sm text-secondary p-3">No ongoing table orders.</div>
            )}

            {tables.map((table) => (
              <button
                key={table.tableId}
                onClick={() => setSelectedTable(table.tableId)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all",
                  selectedTable === table.tableId
                    ? "border-primary bg-primary/5"
                    : "border-outline/10 hover:bg-surface-container-low"
                )}
              >
                <div className="flex justify-between items-center">
                  <p className="font-headline font-bold text-on-surface">Table {table.tableId}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                      statusStyles[table.status]
                  )}>
                    {statusIcon[table.status]}
                    {toTitle(table.status)}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1">{table.orders.length} ongoing order(s)</p>
              </button>
            ))}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-outline/5 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-headline font-extrabold text-primary">
              {selectedTable ? `Table ${selectedTable} Orders` : "Select a Table"}
            </h3>
            <span className="text-xs uppercase tracking-widest font-black text-secondary">
              {selectedTableOrders.length} Active
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {!loading && selectedTable && selectedTableOrders.length === 0 && (
              <div className="text-sm text-secondary">No ongoing orders for this table.</div>
            )}

            {!selectedTable && !loading && (
              <div className="text-sm text-secondary">Pick a table from the left panel.</div>
            )}

            {selectedTableOrders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-outline/10 p-4 bg-surface-container-low/30">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-primary">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-secondary mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                    statusStyles[order.status]
                  )}>
                    {statusIcon[order.status]}
                    {toTitle(order.status)}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {order.items.map((item, idx) => {
                    const menuItem = menuByItemId.get(item.itemId);
                    const name = item.name || menuItem?.name || `Item ${item.itemId}`;
                    return (
                      <div key={`${order._id}-${idx}`} className="flex justify-between text-sm">
                        <span className="text-on-surface">{name} x{item.quantity}</span>
                        <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-outline/10 flex justify-between items-center">
                  <p className="font-headline font-bold text-primary">₹{order.grandTotal.toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value as OngoingStatus)}
                      className="text-xs bg-white border border-outline/10 rounded-lg px-2 py-1 outline-none"
                    >
                      {ONGOING_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {toTitle(status)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateOrderStatus(order._id, "completed")}
                      className="text-xs px-2 py-1 rounded-lg bg-[#808000]/15 text-[#556b2f] border border-[#808000]/30 font-semibold"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order._id, "cancelled")}
                      className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
