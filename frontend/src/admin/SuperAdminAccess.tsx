import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import API from "../lib/api";

type AdminAccount = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "owner";
  status: "active" | "suspended";
  cafeId: string | null;
  cafeName: string;
  restaurantName: string;
  authProvider: string;
  createdAt: string;
};

type CafeOption = {
  _id: string;
  name: string;
  ownerName: string;
  email: string;
};

type AccessSummary = {
  total: number;
  admins: number;
  owners: number;
  cafes: number;
};

export default function SuperAdminAccess() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [summary, setSummary] = useState<AccessSummary>({
    total: 0,
    admins: 0,
    owners: 0,
    cafes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAccountId, setBusyAccountId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "admin123",
    role: "admin" as "admin" | "owner",
    cafeId: "",
  });

  const loadAccessMonitor = async () => {
    try {
      setLoading(true);
      const [adminRes, cafeRes] = await Promise.all([
        API.get<{ admins: AdminAccount[]; summary: AccessSummary }>("/superadmin/admins"),
        API.get<CafeOption[]>("/superadmin/cafes"),
      ]);
      setAdmins(adminRes.data.admins || []);
      setSummary(
        adminRes.data.summary || {
          total: 0,
          admins: 0,
          owners: 0,
          cafes: 0,
        }
      );
      setCafes(cafeRes.data || []);
      setForm((current) => ({
        ...current,
        cafeId: current.cafeId || cafeRes.data?.[0]?._id || "",
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load access monitor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccessMonitor();
  }, []);

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await API.post<{ message: string }>("/superadmin/admins", form);
      setSuccess(res.data?.message || "Admin created successfully");
      setForm({
        name: "",
        email: "",
        password: "admin123",
        role: "admin",
        cafeId: form.cafeId || cafes[0]?._id || "",
      });
      await loadAccessMonitor();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccess = async (account: AdminAccount) => {
    const confirmed = window.confirm(
      `Delete the ${account.role} account for ${account.name}? This removes that login immediately.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyAccountId(account._id);
      setError("");
      setSuccess("");
      const res = await API.delete<{ message: string }>(`/superadmin/admins/${account._id}`);
      setSuccess(res.data?.message || "Access account deleted successfully");
      await loadAccessMonitor();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete access account");
    } finally {
      setBusyAccountId("");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3">
        <nav className="flex gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
          <span>Platform</span>
          <span>/</span>
          <span className="text-primary">Access Monitor</span>
        </nav>
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface">Admin Access Monitor</h1>
          <p className="text-secondary mt-1">
            Review all non-superadmin access across cafes and create backend admin credentials from one place.
          </p>
        </div>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">{success}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Admin Accounts", value: summary.total, icon: Users },
          { label: "Admin Logins", value: summary.admins, icon: ShieldCheck },
          { label: "Owner Logins", value: summary.owners, icon: KeyRound },
          { label: "Cafes Covered", value: summary.cafes, icon: UserPlus },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-white border border-outline/10 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">{item.label}</p>
                <p className="mt-3 text-3xl font-headline font-extrabold text-primary">{item.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <item.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.35fr_0.95fr] gap-8">
        <section className="bg-white rounded-3xl border border-outline/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline/10">
            <h2 className="text-xl font-headline font-bold text-primary">All Admin Access</h2>
            <p className="text-sm text-secondary mt-1">Owners and admin accounts across every cafe, excluding the superadmin login.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Account</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Cafe</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Restaurant</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {!loading && admins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-secondary text-center">
                      No admin accounts found yet.
                    </td>
                  </tr>
                )}

                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-headline font-bold text-on-surface">{admin.name}</p>
                        <p className="text-sm text-secondary">{admin.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {admin.role}
                      </span>
                      <span
                        className={`ml-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          admin.status === "suspended"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-secondary">{admin.cafeName || "Unassigned"}</td>
                    <td className="px-6 py-5 text-sm text-secondary">{admin.restaurantName || "Not linked yet"}</td>
                    <td className="px-6 py-5 text-sm text-secondary">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteAccess(admin)}
                          disabled={busyAccountId === admin._id}
                          aria-label={`Delete ${admin.role} ${admin.name}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {busyAccountId === admin._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-outline/10 shadow-sm p-6">
          <h2 className="text-xl font-headline font-bold text-primary">Add Admin Credentials</h2>
          <p className="text-sm text-secondary mt-1">
            Create a new backend admin or owner login for a selected cafe. Suspended accounts remain visible in the monitor above.
          </p>

          <form onSubmit={handleCreateAdmin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-secondary">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Nina Verma"
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-secondary">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="e.g. admin@yourcafe.com"
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-secondary">Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="admin123"
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-secondary">Access Role</label>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "admin" | "owner" }))}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm outline-none"
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-secondary">Cafe</label>
              <select
                value={form.cafeId}
                onChange={(event) => setForm((current) => ({ ...current, cafeId: event.target.value }))}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm outline-none"
              >
                {cafes.length === 0 && <option value="">No cafes available</option>}
                {cafes.map((cafe) => (
                  <option key={cafe._id} value={cafe._id}>
                    {cafe.ownerName ? `${cafe.name} (${cafe.ownerName})` : `${cafe.name} (No owner)`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || cafes.length === 0}
              className="w-full rounded-2xl bg-primary text-on-primary py-4 font-headline font-bold disabled:opacity-50"
            >
              {saving ? "Creating Access..." : form.role === "owner" ? "Create Owner Login" : "Create Admin Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
