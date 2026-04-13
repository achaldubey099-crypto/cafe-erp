import React from 'react';
import { Settings, Bell, Shield, Globe, Moon, Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Settings</h2>
        <p className="text-secondary font-medium mt-1">Configure your artisan store preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-1">
          {[
            { label: 'General', icon: Settings, active: true },
            { label: 'Notifications', icon: Bell },
            { label: 'Security', icon: Shield },
            { label: 'Localization', icon: Globe },
            { label: 'Appearance', icon: Moon },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                item.active 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'text-secondary hover:bg-surface-container'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline/5 space-y-6">
            <h3 className="text-xl font-headline font-bold text-primary">General Preferences</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Store Name</label>
                <input 
                  type="text" 
                  defaultValue="Artisan Coffee House"
                  className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Store Email</label>
                <input 
                  type="email" 
                  defaultValue="hello@artisan.coffee"
                  className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Currency</label>
                  <select className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Timezone</label>
                  <select className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                    <option>UTC-5 (EST)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-outline/5 flex justify-end">
              <button className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95">
                <Save size={20} />
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 space-y-4">
            <h3 className="text-lg font-headline font-bold text-red-700">Danger Zone</h3>
            <p className="text-sm text-red-600/80 font-medium">Once you delete a store, there is no going back. Please be certain.</p>
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
              Delete Store Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
