import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, ArrowRight, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../lib/api";

interface AnalyticsResponse {
  todaysSales: number;
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  periodTotals?: {
    month: { revenue: number; profit: number };
    year: { revenue: number; profit: number };
    allTime: { revenue: number; profit: number };
  };
  weeklySales: Record<string, number>;
  salesSeries7d?: Array<{ label: string; value: number }>;
  salesSeries30d?: Array<{ label: string; value: number }>;
  bestSellingProduct: { name: string; count: number };
  retentionRate: string | number;
  topSellingItems: Array<{ name: string; quantity: number }>;
  advice: string;
  recentOrders?: Array<{
    _id: string;
    tableId?: number;
    status: string;
    grandTotal: number;
    createdAt: string;
    paymentMethod?: string;
  }>;
}

type FinancialScope = "month" | "year" | "allTime";

const FINANCIAL_SCOPE_OPTIONS: Array<{ key: FinancialScope; label: string }> = [
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "allTime", label: "All Time" },
];

const getChartTickParts = (label: string, range: "7d" | "30d") => {
  if (range === "7d") {
    return { primary: label, secondary: "" };
  }

  const [month = "", day = ""] = label.split(" ");
  return { primary: day || label, secondary: month };
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [financialScope, setFinancialScope] = useState<FinancialScope>("month");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get<AnalyticsResponse>("/analytics");
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard analytics");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(() => {
    if (!analytics) return [];

    if (range === "30d" && analytics.salesSeries30d?.length) {
      return analytics.salesSeries30d.map((point) => ({
        label: point.label,
        value: Number(point.value) || 0,
      }));
    }

    if (analytics.salesSeries7d?.length) {
      return analytics.salesSeries7d.map((point) => ({
        label: point.label,
        value: Number(point.value) || 0,
      }));
    }

    return Object.entries(analytics.weeklySales || {}).map(([label, value]) => ({
      label,
      value: Number(value) || 0,
    }));
  }, [analytics, range]);

  const maxBar = Math.max(...chartData.map((point) => point.value), 1);
  const peakIndex = chartData.findIndex((point) => point.value === maxBar);
  const scopedFinancials = analytics?.periodTotals?.[financialScope] ?? {
    revenue: analytics?.totalRevenue ?? 0,
    profit: analytics?.netProfit ?? 0,
  };
  const financialScopeLabel =
    FINANCIAL_SCOPE_OPTIONS.find((option) => option.key === financialScope)?.label ?? "Month";

  return (
    <div className="space-y-8 w-full">

      {/* HEADER */}
      <div>
        <p className="text-xs uppercase text-gray-400 tracking-widest">
          Morning Overview
        </p>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
      </div>

      <div className="flex justify-end">
        <div className="flex rounded-full bg-gray-100 p-1 text-sm">
          {FINANCIAL_SCOPE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setFinancialScope(option.key)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                financialScope === option.key ? "bg-white text-primary shadow-sm" : "text-secondary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* SALES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="flex justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-xl">
              💰
            </div>
            <span className="text-green-600 text-sm font-bold">
              +12.5%
            </span>
          </div>

          <p className="text-sm text-gray-500">Today's Sales</p>
          <h2 className="text-3xl font-bold">₹{analytics?.todaysSales.toFixed(2) || "0.00"}</h2>
          <div className="mt-4 h-1 bg-gray-200 rounded-full">
            {(() => {
              const current = analytics?.todaysSales || 0;
              const total = analytics?.totalRevenue || 1;
              const percentage = total > 0 ? (current / total) * 100 : 0;
              const safePercentage = Math.max(0, Math.min(percentage || 0, 100));
              const visible = safePercentage > 2 ? safePercentage : 2;
              return <div style={{ width: `${visible}%` }} className="h-1 bg-primary rounded-full" />;
            })()}
          </div>

          <p className="text-xs text-gray-400 mt-2">Live order revenue from today</p>
        </div>

        {/* ORDERS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm " onClick={() => navigate('/admin/pos')}>
          <div className="flex justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              🛒
            </div>
            <span className="text-gray-500 text-sm font-bold">
              All Time
            </span>
          </div>

          <p className="text-sm text-gray-500">Total Orders</p>
          <h2 className="text-3xl font-bold">{analytics?.totalOrders ?? 0}</h2>
          <p className="text-xs text-gray-400 mt-6">Completed, active, and preparing orders combined.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="flex justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700">
              <Wallet size={20} />
            </div>
            <span className="text-gray-500 text-sm font-bold">
              {financialScopeLabel}
            </span>
          </div>

          <p className="text-sm text-gray-500">{financialScopeLabel} Revenue</p>
          <h2 className="text-3xl font-bold">₹{scopedFinancials.revenue.toFixed(2)}</h2>
          <p className="text-xs text-gray-400 mt-6">Revenue updates with the selected time scope.</p>
        </div>

        {/* PROFIT */}
        <div className="bg-gradient-to-br from-[#4E342E] to-[#8D6E63] text-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              📈
            </div>
            <TrendingUp />
          </div>

          <p className="text-sm opacity-80">{financialScopeLabel} Net Profit</p>
          <h2 className="text-3xl font-bold">₹{scopedFinancials.profit.toFixed(2)}</h2>

          <button onClick={() => navigate('/admin/analytics')} className="mt-6 w-full bg-white/20 hover:bg-white/30 transition rounded-xl py-2 flex items-center justify-center gap-2">
            View Report <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm ">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-lg">
                {range === "30d" ? "30 Day Sales Performance" : "Weekly Sales Performance"}
              </h2>
              <p className="text-sm text-secondary">
                {range === "30d" ? "Revenue from the last 30 days" : "Revenue from the last 7 days"}
              </p>
            </div>
            <div className="flex rounded-full bg-gray-100 p-1 text-sm">
              <button
                onClick={() => setRange("7d")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  range === "7d" ? "bg-white text-primary shadow-sm" : "text-secondary"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setRange("30d")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  range === "30d" ? "bg-white text-primary shadow-sm" : "text-secondary"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-52 overflow-hidden px-2 pt-4">
            <div className="flex h-full items-end gap-2 overflow-hidden pb-1">
              {chartData.map((point, index) => {
                const height = point.value > 0 ? Math.max(10, (point.value / maxBar) * 100) : 4;
                const showLabel = range === "7d" || chartData.length <= 10 || index % 5 === 0;
                const tick = getChartTickParts(point.label, range);

                return (
                  <div
                    key={`${point.label}-${index}`}
                    className="flex min-w-0 flex-1 h-full flex-col items-center justify-end gap-2"
                    title={`${point.label}: ₹${point.value.toFixed(2)}`}
                  >
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        index === peakIndex ? "bg-primary" : "bg-gray-200"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="min-h-[24px] w-full text-center text-[10px] font-medium uppercase tracking-wide text-secondary leading-none">
                      {showLabel ? (
                        range === "30d" ? (
                          <>
                            <span className="block">{tick.primary}</span>
                            <span className="block text-[9px] font-medium normal-case tracking-normal">{tick.secondary}</span>
                          </>
                        ) : (
                          point.label
                        )
                      ) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TOP SELLERS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm ">
          <h2 className="font-bold text-lg mb-4">Top Sellers</h2>

          <div className="space-y-4">
            {(analytics?.topSellingItems || []).slice(0, 2).map((item) => (
              <div key={item.name} className="flex justify-between">
                <span>{item.name}</span>
                <span className="font-bold">{item.quantity} sold</span>
              </div>
            ))}
            {(!analytics || analytics.topSellingItems.length === 0) && (
              <div className="text-sm text-secondary">No sales data yet.</div>
            )}
          </div>

          <button className="mt-6 text-sm text-primary font-bold" onClick={() => navigate('/admin/analytics')}>
            Full Menu Analytics →
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm ">
        <div className="p-6 flex justify-between">
          <h2 className="font-bold text-lg">Recent Orders</h2>
          <span className="text-primary text-sm cursor-pointer" onClick={() => navigate('/admin/orders')}>View All</span>
        </div>

        <div className="divide-y">
          {(analytics?.recentOrders || []).map((order) => (
            <div key={order._id} className="flex justify-between p-4 text-sm">
              <span>#{order._id.slice(-4)}</span>
              <span>Table {order.tableId ?? 'N/A'}</span>
              <span className="capitalize">{order.status}</span>
              <span className="font-bold">₹{order.grandTotal.toFixed(2)}</span>
            </div>
          ))}
          {!loading && analytics && (!analytics.recentOrders || analytics.recentOrders.length === 0) && (
            <div className="p-4 text-sm text-secondary">No order insights yet.</div>
          )}
        </div>
      </div>

      {loading && <div className="text-sm text-secondary">Loading dashboard...</div>}
    </div>
  );
}
