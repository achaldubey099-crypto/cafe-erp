import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign } from "lucide-react";

import API from "../lib/api";

type PaymentRecord = {
  orderId: string;
  orderNumber?: number | null;
  tableId?: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: string;
  method: string;
  amount: number;
  source: string;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
};

type PaymentLogResponse = {
  payments: PaymentRecord[];
  summary: {
    totalPayments: number;
    totalCollected: number;
  };
};

export default function AdminPaymentLogs() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const summary = useMemo(
    () => ({
      totalPayments: payments.length,
      totalCollected: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    }),
    [payments]
  );

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get<PaymentLogResponse>("/admin/payments/logs");
        setPayments(res.data.payments || []);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load payment logs");
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    void loadPayments();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Payment Logs</h2>
        <p className="text-secondary font-medium mt-1">Only payments captured during the last 24 hours are shown here.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-outline/10 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Payments in 24h</p>
          <p className="mt-3 text-3xl font-headline font-extrabold text-primary">{summary.totalPayments}</p>
        </div>
        <div className="rounded-3xl bg-white border border-outline/10 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Collected in 24h</p>
          <p className="mt-3 text-3xl font-headline font-extrabold text-primary">Rs {summary.totalCollected.toFixed(2)}</p>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-outline/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CircleDollarSign size={22} />
          </div>
          <div>
            <p className="text-sm font-headline font-bold text-on-surface">Recent payment activity</p>
            <p className="text-xs text-secondary">Useful for reconciliation and live cashier cross-checks.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Order</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Table</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Reference</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-secondary">
                    No payments were recorded in the last 24 hours.
                  </td>
                </tr>
              )}

              {payments.map((payment, index) => (
                <tr key={`${payment.orderId}-${payment.createdAt}-${index}`} className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                    #{payment.orderNumber || payment.orderId.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">Table {payment.tableId ?? "N/A"}</td>
                  <td className="px-6 py-4 text-sm text-secondary">{payment.method}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface">Rs {payment.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-secondary">
                    {payment.transactionId || payment.razorpayPaymentId || payment.razorpayOrderId || "Manual / N/A"}
                  </td>
                  <td className="px-6 py-4 text-xs text-secondary">{new Date(payment.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
