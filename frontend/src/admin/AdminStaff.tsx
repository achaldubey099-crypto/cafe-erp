import React, { useState } from 'react';
import { UserPlus, Shield, TrendingUp, Filter, Edit2, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminStaff() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const stats = [
    { label: "Total Members", value: "24", sub: "+2 this month" },
    { label: "Active Now", value: "8", pulse: true },
    { label: "Roles Defined", value: "5" },
    { label: "Retention Rate", value: "94%" },
  ];

  const staff = [
    { name: "Julianne Velez", role: "Manager", email: "julianne@artisan.coffee", status: "Active", last: "Now", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
    { name: "Marcus Thorne", role: "Barista", email: "m.thorne@artisan.coffee", status: "Active", last: "2h ago", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
    { name: "Sonia Kim", role: "Cashier", email: "sonia.k@artisan.coffee", status: "Inactive", last: "3 days ago", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
            <span>Management</span>
            <span>/</span>
            <span className="text-primary">Staff Roster</span>
          </nav>
          <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">Staff Management</h2>
          <p className="text-secondary mt-2 font-body max-w-lg">Orchestrate your artisan team. Manage roles, permissions, and active status for all digital concierge members.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-outline/5 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{stat.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-primary">{stat.value}</span>
              {stat.sub && <span className="text-[10px] text-green-600 font-bold">{stat.sub}</span>}
              {stat.pulse && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse mb-1" />}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-outline/5">
        <div className="px-8 py-6 flex items-center justify-between bg-surface-container-low/30">
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white rounded-lg text-xs font-bold text-primary shadow-sm">All Staff</button>
            <button className="px-4 py-2 text-xs font-bold text-secondary hover:text-primary transition-colors">By Role</button>
          </div>
          <button className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors">
            <Filter size={18} />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/20">
                <th className="px-8 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Last Active</th>
                <th className="px-8 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {staff.map((member, i) => (
                <tr key={i} className="hover:bg-surface-container-low/10 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container">
                        <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary">{member.name}</div>
                        <div className="text-[10px] text-secondary font-medium">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        member.status === 'Active' ? "bg-green-500" : "bg-secondary/30"
                      )} />
                      <span className="text-xs font-semibold text-on-surface">{member.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs text-secondary font-medium">{member.last}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-[10px] font-bold text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors">Edit</button>
                      <button className="p-2 rounded-lg text-secondary hover:bg-surface-container transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-headline font-bold text-primary">Security & Access</h3>
              <p className="text-xs text-secondary">Define global permissions for staff roles.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
              <span className="text-sm font-semibold text-on-surface">Manager Dashboard Access</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Elevated</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
              <span className="text-sm font-semibold text-on-surface">Inventory Modification</span>
              <span className="px-3 py-1 bg-surface-container text-secondary rounded-lg text-[10px] font-bold uppercase tracking-wider">Restricted</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-headline font-bold text-primary">Team Insights</h3>
              <p className="text-xs text-secondary">Weekly performance summary.</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm h-40 flex items-end gap-2">
            {[40, 60, 80, 50, 70, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t-md transition-all hover:bg-primary" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-headline font-extrabold text-primary">Add New Staff</h3>
                  <p className="text-secondary text-sm font-medium">Create a new profile for a team member.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-surface-container rounded-full transition-colors"
                >
                  <X size={24} className="text-secondary" />
                </button>
              </div>

              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. sarah@artisan.coffee"
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Role</label>
                    <select className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                      <option>Barista</option>
                      <option>Cashier</option>
                      <option>Manager</option>
                      <option>Kitchen Staff</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Shift Type</label>
                    <select className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-surface-container text-secondary rounded-2xl font-headline font-bold hover:bg-surface-container-high transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-primary text-on-primary rounded-2xl font-headline font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                  >
                    Create Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
