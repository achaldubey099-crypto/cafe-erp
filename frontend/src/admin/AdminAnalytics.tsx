import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  Wallet, 
  BarChart2, 
  Star, 
  Users, 
  Lightbulb,
  MoreVertical,
  ArrowUp as ArrowUpward
} from 'lucide-react';
import { cn } from '../lib/utils';
import API from '../lib/api';

interface AnalyticsResponse {
  todaysSales: number;
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin?: number;
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
  paymentBreakdown?: { upi?: number; card?: number; counter?: number };
  hourlyOrders?: Record<string, number>;
}

type FinancialScope = 'month' | 'year' | 'allTime';

const FINANCIAL_SCOPE_OPTIONS: Array<{ key: FinancialScope; label: string }> = [
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'allTime', label: 'All Time' },
];

const getChartTickParts = (label: string, range: '7d' | '30d') => {
  if (range === '7d') {
    return { primary: label, secondary: '' };
  }

  const [month = '', day = ''] = label.split(' ');
  return { primary: day || label, secondary: month };
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [financialScope, setFinancialScope] = useState<FinancialScope>('month');
  const [profitMarginPercent, setProfitMarginPercent] = useState('40');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await API.get<AnalyticsResponse>('/analytics');
        setAnalytics(res.data);
        setProfitMarginPercent(String(Math.round((res.data.profitMargin ?? 0.4) * 100)));
      } catch (err) {
        console.error(err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const saveProfitMargin = async () => {
    const parsed = Number(profitMarginPercent);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setSaveState('error');
      setSaveMessage('Enter a percentage between 0 and 100.');
      return;
    }

    try {
      setSaveState('saving');
      setSaveMessage('');

      const res = await API.patch<AnalyticsResponse>('/analytics/profit-margin', {
        profitMargin: parsed / 100,
      });

      setAnalytics(res.data);
      setProfitMarginPercent(String(Math.round((res.data.profitMargin ?? parsed / 100) * 100)));
      setSaveState('saved');
      setSaveMessage('Profit margin updated.');
    } catch (err) {
      console.error(err);
      setSaveState('error');
      setSaveMessage('Could not update the profit margin.');
    }
  };

  const summary = [
    { label: "Today's Sales", value: `₹${analytics?.todaysSales.toFixed(2) || '0.00'}`, trend: 'Live', icon: TrendingUp },
    { label: 'Total Orders', value: `${analytics?.totalOrders ?? 0}`, trend: 'Live', icon: Receipt },
  ];

  const scopedFinancials = analytics?.periodTotals?.[financialScope] ?? {
    revenue: analytics?.totalRevenue ?? 0,
    profit: analytics?.netProfit ?? 0,
  };

  const financialScopeLabel = FINANCIAL_SCOPE_OPTIONS.find((option) => option.key === financialScope)?.label ?? 'Month';

  const chartData = useMemo(() => {
    if (!analytics) return [];

    if (range === '30d' && analytics.salesSeries30d?.length) {
      return analytics.salesSeries30d.map((point) => ({
        name: point.label,
        value: Number(point.value) || 0,
      }));
    }

    if (analytics.salesSeries7d?.length) {
      return analytics.salesSeries7d.map((point) => ({
        name: point.label,
        value: Number(point.value) || 0,
      }));
    }

    return Object.entries(analytics.weeklySales || {}).map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }));
  }, [analytics, range]);

  const maxBar = Math.max(...chartData.map((d) => Number(d.value) || 0), 1);
  const maxIndex = chartData.findIndex((d) => Number(d.value) === maxBar);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-secondary font-bold tracking-wide uppercase">Performance Overview</p>
          <h2 className="text-3xl font-extrabold text-primary mt-1 font-headline">Business Analytics</h2>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-surface-container-high p-1 rounded-2xl">
            {FINANCIAL_SCOPE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setFinancialScope(option.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  financialScope === option.key ? 'bg-white text-primary shadow-sm' : 'text-secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex bg-surface-container-high p-1 rounded-2xl">
            <button
              onClick={() => setRange('7d')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${range === '7d' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${range === '30d' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summary.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                <item.icon size={24} />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1",
                item.trend === 'Stable' ? "bg-secondary/10 text-secondary" : "bg-green-50 text-green-600"
              )}>
                {item.trend !== 'Stable' && <ArrowUpward size={12} />}
                {item.trend}
              </span>
            </div>
            <div className="text-secondary text-xs font-bold uppercase tracking-wider">{item.label}</div>
            <div className="text-2xl font-black text-on-surface mt-1 font-headline">{item.value}</div>
          </div>
        ))}

        <div className="bg-white p-6 rounded-3xl shadow-sm hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/5 rounded-2xl text-primary">
              <Wallet size={24} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-surface-container text-secondary">
              {financialScopeLabel}
            </span>
          </div>
          <div className="text-secondary text-xs font-bold uppercase tracking-wider">{financialScopeLabel} Revenue</div>
          <div className="text-2xl font-black text-on-surface mt-1 font-headline">₹{scopedFinancials.revenue.toFixed(2)}</div>
        </div>
        
        <div className="bg-primary text-on-primary p-6 rounded-3xl shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <BarChart2 size={24} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/15 text-white/90">
              {financialScopeLabel}
            </span>
          </div>
          <div className="text-on-primary/70 text-xs font-bold uppercase tracking-wider">{financialScopeLabel} Net Profit</div>
          <div className="text-2xl font-black mt-1 font-headline">₹{scopedFinancials.profit.toFixed(2)}</div>
          <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
            {(() => {
              const current = scopedFinancials.profit || 0;
              const total = scopedFinancials.revenue || 1;
              const percentage = total > 0 ? (current / total) * 100 : 0;
              const safePercentage = Math.max(0, Math.min(percentage || 0, 100));
              const visible = safePercentage > 2 ? safePercentage : 2;
              return <div className="h-full bg-white" style={{ width: `${visible}%` }} />;
            })()}
          </div>
          <div className="text-[10px] uppercase tracking-wider mt-2 opacity-80 font-bold">{(() => {
            const current = scopedFinancials.profit || 0;
            const total = scopedFinancials.revenue || 1;
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            return `${percentage}% of target hit`;
          })()}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary">Net Profit Margin</h3>
            <p className="text-sm text-secondary">Adjust the percentage used to estimate net profit from revenue.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-secondary">Profit Margin %</label>
              <div className="flex items-center rounded-xl border border-outline/10 bg-surface-container-low px-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={profitMarginPercent}
                  onChange={(e) => {
                    setProfitMarginPercent(e.target.value);
                    if (saveState !== 'idle') {
                      setSaveState('idle');
                      setSaveMessage('');
                    }
                  }}
                  className="w-24 bg-transparent py-3 text-sm font-semibold text-on-surface outline-none"
                />
                <span className="text-sm font-semibold text-secondary">%</span>
              </div>
            </div>
            <button
              onClick={saveProfitMargin}
              disabled={saveState === 'saving'}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveState === 'saving' ? 'Saving...' : 'Save Margin'}
            </button>
          </div>
        </div>
        {saveMessage && (
          <p className={`mt-3 text-sm ${saveState === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {saveMessage}
          </p>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Area */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-outline/5">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-primary font-headline">
                {range === '30d' ? '30 Day Sales Trend' : 'Weekly Sales Trend'}
              </h3>
              <p className="text-sm text-secondary">
                {range === '30d' ? 'Revenue performance over the last 30 days' : 'Revenue performance over the last 7 days'}
              </p>
            </div>
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <MoreVertical size={20} className="text-secondary" />
            </button>
          </div>
          <div className="h-64 overflow-hidden px-4 pt-6">
            <div className="flex h-full items-end gap-2 overflow-hidden pr-3">
            {chartData.map((d, i) => {
              const value = Number(d.value) || 0;
              const height = value > 0 ? Math.max(10, (value / maxBar) * 100) : 4;
              const showLabel = range === '7d' || chartData.length <= 10 || i % 5 === 0;
              const showValue = value > 0 && (range === '7d' || i === maxIndex || showLabel);
              const tick = getChartTickParts(d.name, range);
              return (
                <div
                  key={d.name}
                  className="flex min-w-0 flex-1 h-full flex-col items-center justify-end gap-2 group cursor-pointer"
                  title={`${d.name}: ₹${value.toFixed(2)}`}
                >
                  <span className={`min-h-[16px] text-[11px] font-semibold text-secondary transition-opacity ${showValue ? 'opacity-100' : 'opacity-0'}`}>
                    ₹{value.toFixed(0)}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-500",
                      i === maxIndex ? "bg-primary" : "bg-surface-container-high group-hover:bg-primary/20"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="min-h-[24px] text-center text-[10px] font-bold uppercase text-secondary leading-none">
                    {showLabel ? (
                      range === '30d' ? (
                        <>
                          <span className="block">{tick.primary}</span>
                          <span className="block text-[9px] font-medium normal-case tracking-normal">{tick.secondary}</span>
                        </>
                      ) : (
                        d.name
                      )
                    ) : ''}
                  </span>
                </div>
              );
            })}
            </div>
          </div>

          {/* Additional Reports Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-secondary">Total Revenue</div>
                <div className="text-xl font-bold">₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-secondary">Total Orders</div>
                <div className="text-xl font-bold">{analytics?.totalOrders ?? 0}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-secondary">Average Order Value</div>
                <div className="text-xl font-bold">{(() => {
                  const orders = analytics?.totalOrders || 0;
                  const revenue = analytics?.totalRevenue || 0;
                  const aov = orders > 0 ? revenue / orders : 0;
                  return `₹${aov.toFixed(2)}`;
                })()}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-bold mb-3">Payment Breakdown</h4>
                <div className="space-y-2 text-sm text-secondary">
                  <div>UPI Orders: {analytics?.paymentBreakdown?.upi ?? 'N/A'}</div>
                  <div>Card Orders: {analytics?.paymentBreakdown?.card ?? 'N/A'}</div>
                  <div>Counter Orders: {analytics?.paymentBreakdown?.counter ?? 'N/A'}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-bold mb-3">Top Sellers (Top 5)</h4>
                <div className="space-y-2 text-sm">
                  {(analytics?.topSellingItems || []).slice(0,5).map((it) => (
                    <div key={it.name} className="flex justify-between">
                      <span>{it.name}</span>
                      <span className="font-bold">{it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-bold mb-3">Low Performing Items (Bottom 3)</h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const items = analytics?.topSellingItems || [];
                    const sorted = [...items].sort((a,b) => a.quantity - b.quantity).slice(0,3);
                    if (sorted.length === 0) return <div className="text-secondary">No data</div>;
                    return sorted.map(it => (
                      <div key={it.name} className="flex justify-between">
                        <span>{it.name}</span>
                        <span className="font-bold">{it.quantity}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-bold mb-3">Peak Hours</h4>
                <div className="text-sm text-secondary">
                  {analytics?.hourlyOrders ? (
                    (() => {
                      const hours = analytics.hourlyOrders as Record<string, number>;
                      const entries = Object.entries(hours || {});
                      if (entries.length === 0) return <div>No data</div>;
                      const peak = entries.reduce((a,b) => a[1] > b[1] ? a : b);
                      return <div>Peak hour: {peak[0]} ({peak[1]} orders)</div>;
                    })()
                  ) : (
                    <div className="text-secondary">Hourly data not available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 flex-1 shadow-sm border border-outline/5">
            <h3 className="text-lg font-bold mb-6 text-primary font-headline">Key Insights</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
                  <Star size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-secondary tracking-wider">Best Seller</div>
                  <div className="text-base font-bold text-on-surface">{analytics?.bestSellingProduct.name || 'N/A'}</div>
                  <div className="text-[10px] text-secondary font-medium">{analytics?.bestSellingProduct.count || 0} units sold</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-secondary tracking-wider">Retention</div>
                  <div className="text-base font-bold text-on-surface">{analytics?.retentionRate || 0}%</div>
                  <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                    <ArrowUpward size={10} /> Based on repeat customers
                  </div>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl mt-4 border border-outline/10">
                <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
                  <Lightbulb size={14} />
                  Smart Advice
                </div>
                <p className="text-[11px] text-secondary leading-relaxed font-medium">
                  {analytics?.advice || 'No recommendation yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-secondary">Loading analytics...</div>}
    </div>
  );
}
