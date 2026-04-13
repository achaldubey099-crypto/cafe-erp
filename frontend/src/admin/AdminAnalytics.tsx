import React from 'react';
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

export default function AdminAnalytics() {
  const summary = [
    { label: "Today's Sales", value: "$2,845.00", trend: "12%", icon: TrendingUp },
    { label: "Total Orders", value: "148", trend: "Stable", icon: Receipt },
    { label: "Total Revenue", value: "$18,240.50", trend: "8%", icon: Wallet },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-secondary font-bold tracking-wide uppercase">Performance Overview</p>
          <h2 className="text-3xl font-extrabold text-primary mt-1 font-headline">Business Analytics</h2>
        </div>
        <div className="flex bg-surface-container-high p-1 rounded-2xl">
          <button className="px-6 py-2 rounded-xl text-sm font-bold transition-all bg-white shadow-sm text-primary">Today</button>
          <button className="px-6 py-2 rounded-xl text-sm font-bold transition-all text-secondary hover:text-primary">Weekly</button>
          <button className="px-6 py-2 rounded-xl text-sm font-bold transition-all text-secondary hover:text-primary">Monthly</button>
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
        
        <div className="bg-primary text-on-primary p-6 rounded-3xl shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <BarChart2 size={24} />
            </div>
          </div>
          <div className="text-on-primary/70 text-xs font-bold uppercase tracking-wider">Net Profit</div>
          <div className="text-2xl font-black mt-1 font-headline">$1,120.25</div>
          <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-3/4" />
          </div>
          <div className="text-[10px] uppercase tracking-wider mt-2 opacity-80 font-bold">75% of target hit</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Area */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-outline/5">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-primary font-headline">Weekly Sales Trend</h3>
              <p className="text-sm text-secondary">Revenue performance over the last 7 days</p>
            </div>
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <MoreVertical size={20} className="text-secondary" />
            </button>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {[40, 55, 45, 85, 65, 70, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div 
                  className={cn(
                    "w-full rounded-t-xl transition-all duration-500",
                    i === 3 ? "bg-primary" : "bg-surface-container-high group-hover:bg-primary/20"
                  )} 
                  style={{ height: `${h}%` }} 
                />
                <span className="text-[10px] font-bold text-secondary uppercase">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
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
                  <div className="text-base font-bold text-on-surface">Oat Milk Latte</div>
                  <div className="text-[10px] text-secondary font-medium">42 units sold today</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-secondary tracking-wider">Retention</div>
                  <div className="text-base font-bold text-on-surface">68.4%</div>
                  <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                    <ArrowUpward size={10} /> 2.1% from last month
                  </div>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl mt-4 border border-outline/10">
                <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
                  <Lightbulb size={14} />
                  Smart Advice
                </div>
                <p className="text-[11px] text-secondary leading-relaxed font-medium">
                  Morning rush starts 15 mins earlier on Thursdays. Consider scheduling an extra barista at 7:45 AM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
