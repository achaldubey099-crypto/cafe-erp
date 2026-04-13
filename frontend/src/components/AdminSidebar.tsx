import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  ClipboardList, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminSidebar() {
  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/pos', icon: Store, label: 'POS' },
    { to: '/admin/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/admin/inventory', icon: Package, label: 'Inventory' },
    { to: '/admin/staff', icon: Users, label: 'Staff' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-8 px-4 z-50 border-r border-outline/10">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-bold text-primary font-headline tracking-tight">Artisan Admin</h1>
        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">The Digital Concierge</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-headline font-medium text-sm tracking-tight",
                isActive 
                  ? "bg-surface-container-highest text-primary font-bold border-r-4 border-primary" 
                  : "text-secondary hover:text-primary hover:bg-surface-container-high"
              )
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline/10 pt-6">
        <NavLink
          to="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 text-secondary hover:text-primary hover:bg-surface-container-high rounded-xl font-headline font-medium text-sm transition-all"
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl font-headline font-medium text-sm transition-all">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
