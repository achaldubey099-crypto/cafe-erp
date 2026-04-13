import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import API from "../lib/api";

interface AnalyticsResponse {
  todaysSales: number;
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  weeklySales: Record<string, number>;
  bestSellingProduct: { name: string; count: number };
  retentionRate: string | number;
  topSellingItems: Array<{ name: string; quantity: number }>;
  advice: string;
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const weeklyBars = useMemo(() => {
    const source = analytics?.weeklySales || {};
    return DAY_ORDER.map((day) => source[day] || 0);
  }, [analytics]);

  const maxBar = Math.max(...weeklyBars, 1);

  return (
    <div className="space-y-8 w-full">

      {/* HEADER */}
      <div>
        <p className="text-xs uppercase text-gray-400 tracking-widest">
          Morning Overview
        </p>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
            <div className="w-[65%] h-1 bg-primary rounded-full"></div>
          </div>

          <p className="text-xs text-gray-400 mt-2">Live from `analyticsController`</p>
        </div>

        {/* ORDERS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm ">
          <div className="flex justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              🛒
            </div>
            <span className="text-gray-500 text-sm font-bold">
              Normal
            </span>
          </div>

          <p className="text-sm text-gray-500">Total Orders</p>
          <h2 className="text-3xl font-bold">{analytics?.totalOrders ?? 0}</h2>

          <div className="flex mt-4 gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold">
              +12
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">Daily order volume</p>
        </div>

        {/* PROFIT */}
        <div className="bg-gradient-to-br from-[#4E342E] to-[#8D6E63] text-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              📈
            </div>
            <TrendingUp />
          </div>

          <p className="text-sm opacity-80">Net Profit (Monthly)</p>
          <h2 className="text-3xl font-bold">₹{analytics?.netProfit.toFixed(2) || "0.00"}</h2>

          <button className="mt-6 w-full bg-white/20 hover:bg-white/30 transition rounded-xl py-2 flex items-center justify-center gap-2">
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
            <h2 className="font-bold text-lg">Weekly Sales Performance</h2>
            <div className="flex gap-2 text-sm">
              <button className="bg-gray-200 px-3 py-1 rounded-full">7 Days</button>
              <button className="px-3 py-1">30 Days</button>
            </div>
          </div>

          {/* Fake chart */}
          <div className="flex items-end gap-4 h-40">
            {weeklyBars.map((value, i) => (
              <div
                key={i}
                className={`w-full rounded ${
                  i === weeklyBars.indexOf(maxBar) ? "bg-primary" : "bg-gray-200"
                }`}
                style={{ height: `${Math.max(12, (value / maxBar) * 100)}%` }}
              />
            ))}
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

          <button className="mt-6 text-sm text-primary font-bold">
            Full Menu Analytics →
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm ">
        <div className="p-6 flex justify-between">
          <h2 className="font-bold text-lg">Recent Orders</h2>
          <span className="text-primary text-sm cursor-pointer">View All</span>
        </div>

        <div className="divide-y">
          {(analytics?.topSellingItems || []).slice(0, 3).map((item, idx) => (
            <div key={item.name} className="flex justify-between p-4 text-sm">
              <span>#{idx + 1}</span>
              <span>{item.name}</span>
              <span>Top Item</span>
              <span className="font-bold">{item.quantity} sold</span>
            </div>
          ))}
          {!loading && analytics && analytics.topSellingItems.length === 0 && (
            <div className="p-4 text-sm text-secondary">No order insights yet.</div>
          )}
        </div>
      </div>

      {loading && <div className="text-sm text-secondary">Loading dashboard...</div>}
    </div>
  );
}