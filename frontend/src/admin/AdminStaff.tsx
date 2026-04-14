import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, TrendingUp, Filter, Edit2, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';
import API from '../lib/api';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  lastActive?: string;
  img?: string;
}

export default function AdminStaff() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const [form, setForm] = useState({ name: '', email: '', role: 'barista' });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await API.get<{ staff: StaffMember[] }>('/staff');
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', role: 'barista' });
    setIsModalOpen(true);
  };

  const submitForm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setError('');
      if (editing) {
        const res = await API.put<StaffMember>(`/staff/${editing._id}`, form);
        setStaffList((prev) => prev.map((s) => (s._id === editing._id ? res.data : s)));
      } else {
        const res = await API.post<StaffMember>('/staff', form);
        setStaffList((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditing(member);
    setForm({ name: member.name, email: member.email, role: member.role });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete staff member?')) return;
    try {
      await API.delete(`/staff/${id}`);
      setStaffList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete staff');
    }
  };

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
          onClick={openCreate}
          className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
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
              {!loading && staffList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-sm text-secondary">No staff members yet.</td>
                </tr>
              )}

              {staffList.map((member) => (
                <tr key={member._id} className="hover:bg-surface-container-low/10 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container">
                        <img src={member.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary">{member.name}</div>
                        <div className="text-[10px] text-secondary font-medium">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">{member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : ''}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", member.status === 'active' ? "bg-green-500" : "bg-secondary/30")} />
                      <span className="text-xs font-semibold text-on-surface">{member.status || 'active'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs text-secondary font-medium">{member.lastActive || '—'}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-200"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(member._id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all duration-200"
                      >
                        <X size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-headline font-extrabold text-primary">{editing ? 'Edit Staff' : 'Add New Staff'}</h3>
                  <p className="text-secondary text-sm font-medium">Create or update a team member profile.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <X size={24} className="text-secondary" />
                </button>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-700 rounded mb-4">{error}</div>}

              <form onSubmit={submitForm} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Full Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} type="text" placeholder="e.g. Sarah Connor" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Email Address</label>
                  <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="e.g. sarah@artisan.coffee" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Role</label>
                    <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                      <option value="barista">Barista</option>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
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
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-surface-container text-secondary rounded-2xl font-headline font-bold hover:bg-surface-container-high transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-primary text-on-primary rounded-2xl font-headline font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">{editing ? 'Save Changes' : 'Create Profile'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
