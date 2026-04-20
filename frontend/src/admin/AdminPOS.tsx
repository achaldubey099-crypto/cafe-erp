import React, { useEffect, useMemo, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, XCircle, Merge, ReceiptText } from "lucide-react";

import API from "../lib/api";
import { cn } from "../lib/utils";
import { Product } from "../types";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type OngoingStatus = "pending" | "preparing" | "ready";
type PaymentStatus = "pending" | "partial" | "paid";

interface OrderItem {
  itemId: number;
  name?: string;
  price: number;
  quantity: number;
}

interface PosOrder {
  _id: string;
  orderNumber?: number | null;
  tableId: number;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  grandTotal: number;
  createdAt: string;
}

interface BillView {
  id: string;
  label: string;
  orderIds: string[];
  tableId: number | null;
  items: OrderItem[];
  status: OrderStatus;
  grandTotal: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  printable: boolean;
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

const getAmountPaid = (order: PosOrder) => Math.max(0, Number(order.amountPaid) || 0);
const getPendingAmount = (order: PosOrder) => Math.max(0, order.grandTotal - getAmountPaid(order));

const getPaymentBadge = (paymentStatus: PaymentStatus, pendingAmount: number) => {
  if (paymentStatus === "paid" || pendingAmount <= 0) {
    return {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      label: "Payment Done",
    };
  }

  return {
    className: "bg-amber-100 text-amber-700 border-amber-200",
    label: `Payment Pending Rs ${pendingAmount.toFixed(2)}`,
  };
};

const mergeOrderItems = (orders: PosOrder[]) => {
  const grouped = new Map<string, OrderItem>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = `${item.name || item.itemId}-${item.price}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        grouped.set(key, { ...item });
      }
    });
  });

  return [...grouped.values()];
};

export default function AdminPOS() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMergedView, setIsMergedView] = useState(false);

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
        API.get<PosOrder[]>("/admin/orders/active"),
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
    void loadPosData();

    const interval = window.setInterval(() => {
      void loadPosData();
    }, 5000);

    return () => window.clearInterval(interval);
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

  useEffect(() => {
    if (selectedTableOrders.length <= 1) {
      setIsMergedView(false);
    }
  }, [selectedTableOrders.length, selectedTable]);

  const mergedBill = useMemo<BillView | null>(() => {
    if (!selectedTable || selectedTableOrders.length === 0) {
      return null;
    }

    const grandTotal = selectedTableOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const amountPaid = selectedTableOrders.reduce((sum, order) => sum + getAmountPaid(order), 0);
    const pendingAmount = Math.max(0, grandTotal - amountPaid);

    return {
      id: `table-${selectedTable}`,
      label: `Table ${selectedTable} merged bill`,
      orderIds: selectedTableOrders.map((order) => order._id),
      tableId: selectedTable,
      items: mergeOrderItems(selectedTableOrders),
      status: selectedTableOrders.some((order) => order.status === "preparing")
        ? "preparing"
        : selectedTableOrders.some((order) => order.status === "pending")
          ? "pending"
          : "ready",
      grandTotal,
      amountPaid,
      pendingAmount,
      paymentStatus: pendingAmount <= 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
      createdAt: selectedTableOrders[0]?.createdAt || new Date().toISOString(),
      printable: true,
    };
  }, [selectedTable, selectedTableOrders]);

  const visibleBills = useMemo<BillView[]>(() => {
    if (isMergedView && mergedBill) {
      return [mergedBill];
    }

    return selectedTableOrders.map((order) => ({
      id: order._id,
      label: order.orderNumber ? `Order #${order.orderNumber}` : `Order #${order._id.slice(-6).toUpperCase()}`,
      orderIds: [order._id],
      tableId: order.tableId,
      items: order.items,
      status: order.status,
      grandTotal: order.grandTotal,
      amountPaid: getAmountPaid(order),
      pendingAmount: getPendingAmount(order),
      paymentStatus: order.paymentStatus || (getPendingAmount(order) <= 0 ? "paid" : "pending"),
      createdAt: order.createdAt,
      printable: selectedTableOrders.length === 1,
    }));
  }, [isMergedView, mergedBill, selectedTableOrders]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await API.put(`/admin-orders/${orderId}/status`, { status });

      setOrders((prev) =>
        prev
          .map((order) => (order._id === orderId ? { ...order, status } : order))
          .filter((order) => ONGOING_STATUSES.includes(order.status as OngoingStatus))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update order status in POS");
    }
  };

  const updateSelectedTableToFinished = async () => {
    try {
      await Promise.all(
        selectedTableOrders.map((order) => API.put(`/admin-orders/${order._id}/status`, { status: "completed" }))
      );

      setOrders((prev) =>
        prev.filter((order) => !selectedTableOrders.some((selectedOrder) => selectedOrder._id === order._id))
      );
      setIsMergedView(false);
    } catch (err) {
      console.error(err);
      setError("Failed to finish all orders on this table");
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await API.delete(`/admin-orders/${orderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete order");
    }
  };

  const handlePrintBill = (bill: BillView) => {
    const subtotal = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const printContents = `
      <html>
      <head>
        <title>Bill</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; font-size:14px; }
          h2 { text-align: center; margin-bottom: 4px; }
          .info { text-align: center; margin-bottom: 10px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 6px; text-align: left; border-bottom: 1px solid #ddd; }
          th { font-weight: bold; }
          .right { text-align: right; }
          .summary-row td { border-bottom: none; }
          .footer { text-align: center; margin-top: 12px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h2>Cafe ERP</h2>
        <div class="info">Table: ${bill.tableId ?? ""}<br/>Bill: ${bill.label}<br/>Date: ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item) => `
              <tr>
                <td>${(item.name || `Item ${item.itemId}`).toString().replace(/</g,'&lt;')}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">Rs ${item.price.toFixed(2)}</td>
                <td class="right">Rs ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="3"><strong>Subtotal</strong></td>
              <td class="right"><strong>Rs ${subtotal.toFixed(2)}</strong></td>
            </tr>
            <tr class="summary-row">
              <td colspan="3"><strong>Grand Total</strong></td>
              <td class="right"><strong>Rs ${bill.grandTotal.toFixed(2)}</strong></td>
            </tr>
            <tr class="summary-row">
              <td colspan="3"><strong>Already Paid</strong></td>
              <td class="right"><strong>- Rs ${bill.amountPaid.toFixed(2)}</strong></td>
            </tr>
            <tr class="summary-row">
              <td colspan="3"><strong>Balance Due</strong></td>
              <td class="right"><strong>Rs ${bill.pendingAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">Thank you. Visit again.</div>
      </body>
      </html>
    `;

    const newWindow = window.open("", "", "width=800,height=600");
    if (!newWindow) {
      return;
    }

    newWindow.document.write(printContents);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
    newWindow.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">POS Tables</h2>
          <p className="text-secondary font-medium mt-1">Only ongoing orders are shown here. Use Finish when the customer leaves the table.</p>
        </div>
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
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-xl font-headline font-extrabold text-primary">
              {selectedTable ? `Table ${selectedTable} Orders` : "Select a Table"}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {selectedTableOrders.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsMergedView((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
                >
                  <Merge size={14} />
                  {isMergedView ? "Split Bills" : "Merge Bills"}
                </button>
              )}
              <span className="text-xs uppercase tracking-widest font-black text-secondary">
                {selectedTableOrders.length} Active
              </span>
            </div>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {!loading && selectedTable && selectedTableOrders.length === 0 && (
              <div className="text-sm text-secondary">No ongoing orders for this table.</div>
            )}

            {!selectedTable && !loading && (
              <div className="text-sm text-secondary">Pick a table from the left panel.</div>
            )}

            {visibleBills.map((bill) => {
              const paymentBadge = getPaymentBadge(bill.paymentStatus, bill.pendingAmount);

              return (
                <article key={bill.id} className="rounded-2xl border border-outline/10 p-4 bg-surface-container-low/30">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-primary">{bill.label}</p>
                      <p className="text-xs text-secondary mt-1">{new Date(bill.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                        statusStyles[bill.status]
                      )}>
                        {statusIcon[bill.status]}
                        {toTitle(bill.status)}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold",
                        paymentBadge.className
                      )}>
                        {paymentBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {bill.items.map((item, idx) => {
                      const menuItem = menuByItemId.get(item.itemId);
                      const name = item.name || menuItem?.name || `Item ${item.itemId}`;

                      return (
                        <div key={`${bill.id}-${idx}`} className="flex justify-between text-sm">
                          <span className="text-on-surface">{name} x{item.quantity}</span>
                          <span className="font-semibold">Rs {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {isMergedView && bill.orderIds.length > 1 && (
                    <div className="mt-4 rounded-2xl bg-white/80 p-3 text-xs text-secondary">
                      Included orders: {selectedTableOrders.map((order) => order.orderNumber || order._id.slice(-6).toUpperCase()).join(", ")}
                    </div>
                  )}

                  <div className="mt-3 grid gap-2 text-xs text-secondary sm:grid-cols-3">
                    <div className="rounded-xl bg-white/80 px-3 py-2">
                      <span className="font-bold text-on-surface">Subtotal</span>
                      <p>Rs {bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-2">
                      <span className="font-bold text-on-surface">Already Paid</span>
                      <p>Rs {bill.amountPaid.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-2">
                      <span className="font-bold text-on-surface">Balance Due</span>
                      <p>Rs {bill.pendingAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-outline/10 flex flex-wrap justify-between items-center gap-3">
                    <p className="font-headline font-bold text-primary">Rs {bill.grandTotal.toFixed(2)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintBill(bill)}
                        disabled={!bill.printable}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition-all disabled:cursor-not-allowed disabled:bg-slate-300"
                        title={!bill.printable ? "Print is enabled only after the table bill is merged or when there is a single order." : "Print bill"}
                      >
                        <ReceiptText size={14} />
                        Print Bill
                      </button>

                      {isMergedView ? (
                        <button
                          type="button"
                          onClick={updateSelectedTableToFinished}
                          className="text-xs px-3 py-2 rounded-lg bg-[#808000]/15 text-[#556b2f] border border-[#808000]/30 font-semibold"
                        >
                          Finish Table
                        </button>
                      ) : (
                        <>
                          <select
                            value={bill.status}
                            onChange={(e) => updateOrderStatus(bill.orderIds[0], e.target.value as OngoingStatus)}
                            className="text-xs bg-white border border-outline/10 rounded-lg px-2 py-2 outline-none"
                          >
                            {ONGOING_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {toTitle(status)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateOrderStatus(bill.orderIds[0], "completed")}
                            className="text-xs px-3 py-2 rounded-lg bg-[#808000]/15 text-[#556b2f] border border-[#808000]/30 font-semibold"
                          >
                            Finish
                          </button>
                          <button
                            onClick={() => updateOrderStatus(bill.orderIds[0], "cancelled")}
                            className="text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700 border border-red-200 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteOrder(bill.orderIds[0])}
                            className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100 font-semibold"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
