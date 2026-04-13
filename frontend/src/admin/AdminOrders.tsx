import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';
import { cn } from "../lib/utils";

interface Order {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  time: string;
  type: 'Dine-in' | 'Takeaway' | 'Delivery';
}

const MOCK_ORDERS: Order[] = [
  { id: '#ORD-2849', customer: 'Alex Johnson', items: 'Signature Latte, Butter Croissant', total: 12.75, status: 'Preparing', time: '5 mins ago', type: 'Dine-in' },
  { id: '#ORD-2848', customer: 'Sarah Williams', items: 'Nitro Cold Brew, Avocado Toast', total: 18.50, status: 'Ready', time: '12 mins ago', type: 'Takeaway' },
  { id: '#ORD-2847', customer: 'Michael Chen', items: 'Flat White, Blueberry Muffin', total: 9.25, status: 'Completed', time: '25 mins ago', type: 'Dine-in' },
  { id: '#ORD-2846', customer: 'Emily Davis', items: 'Iced Matcha, Turkey Sandwich', total: 15.00, status: 'Pending', time: '2 mins ago', type: 'Delivery' },
  { id: '#ORD-2845', customer: 'Robert Brown', items: 'Espresso, Pain au Chocolat', total: 7.50, status: 'Cancelled', time: '45 mins ago', type: 'Takeaway' },
];

export default function AdminOrders() {
  const [filter, setFilter] = useState('All');
  
  const statusStyles = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Preparing: "bg-blue-100 text-blue-700 border-blue-200",
    Ready: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcons = {
    Pending: <Clock size={14} />,
    Preparing: <AlertCircle size={14} />,
    Ready: <AlertCircle size={14} />,
    Completed: <CheckCircle2 size={14} />,
    Cancelled: <XCircle size={14} />,
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Order Management</h2>
          <p className="text-secondary font-medium mt-1">Track and manage all customer orders in real-time.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline/10 rounded-xl text-sm font-bold text-secondary hover:bg-surface-container transition-all">
            <Download size={18} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-outline/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((f) => (
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
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text"
            placeholder="Search by Order ID or Customer..."
            className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-outline/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Items</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {MOCK_ORDERS.filter(o => filter === 'All' || o.status === filter).map((order) => (
                <tr key={order.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-xs text-primary">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-sm text-on-surface">{order.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-secondary line-clamp-1 max-w-[200px]">{order.items}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container rounded-lg text-secondary uppercase tracking-tighter">
                      {order.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-headline font-extrabold text-on-surface">${order.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                      statusStyles[order.status]
                    )}>
                      {statusIcons[order.status]}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-outline font-medium">{order.time}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-6 border-t border-outline/5 flex justify-between items-center bg-surface-container-low/20">
          <p className="text-xs text-secondary font-medium">Showing 5 of 128 orders</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-outline/10 rounded-lg text-xs font-bold text-secondary disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 bg-white border border-outline/10 rounded-lg text-xs font-bold text-primary shadow-sm">1</button>
            <button className="px-3 py-1 border border-outline/10 rounded-lg text-xs font-bold text-secondary">2</button>
            <button className="px-3 py-1 border border-outline/10 rounded-lg text-xs font-bold text-secondary">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
