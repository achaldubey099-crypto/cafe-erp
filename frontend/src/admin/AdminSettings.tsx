import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';

type RestaurantSettings = {
  brandName: string;
  logoUrl: string;
  description: string;
  publicRestaurantId: string;
  tables: Array<{ publicTableId: string; label: string; tableNumber: number }>;
};

export default function AdminSettings() {
  const { login, user } = useAuth();
  const [form, setForm] = useState<RestaurantSettings>({
    brandName: '',
    logoUrl: '',
    description: '',
    publicRestaurantId: '',
    tables: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/admin/restaurant/me');
        setForm({
          brandName: res.data.brandName,
          logoUrl: res.data.logoUrl || '',
          description: res.data.description || '',
          publicRestaurantId: res.data.publicRestaurantId,
          tables: res.data.tables || [],
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load restaurant settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      const res = await API.patch('/admin/restaurant/me', {
        brandName: form.brandName,
        logoUrl: form.logoUrl,
        description: form.description,
      });

      setForm((prev) => ({
        ...prev,
        brandName: res.data.restaurant.brandName,
        logoUrl: res.data.restaurant.logoUrl || '',
        description: res.data.restaurant.description || '',
        publicRestaurantId: res.data.restaurant.publicRestaurantId,
        tables: res.data.restaurant.tables || prev.tables,
      }));

      if (user) {
        login({
          token: localStorage.getItem('token'),
          user: {
            ...user,
            restaurantName: res.data.restaurant.brandName,
            restaurantLogo: res.data.restaurant.logoUrl || '',
          },
        });
      }
      setMessage('Restaurant branding saved.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Restaurant Settings</h2>
        <p className="text-secondary font-medium mt-1">Change your brand name, logo, and verify the public table access keys used by the QR flow.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}
      {message && <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-sm text-green-700">{message}</div>}

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline/5 space-y-6">
        <div className="grid md:grid-cols-[140px_1fr] gap-6 items-start">
          <img
            src={form.logoUrl || 'https://placehold.co/200x200/png'}
            alt={form.brandName || 'Restaurant logo'}
            className="w-32 h-32 rounded-3xl object-cover bg-surface-container"
          />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Brand Name</label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm outline-none"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Logo URL</label>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm outline-none"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Brand Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full min-h-[110px] bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm outline-none"
            disabled={loading}
          />
        </div>

        <div className="rounded-2xl bg-surface-container-low p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Public Restaurant Key</p>
          <p className="mt-2 font-mono text-sm text-on-surface">{form.publicRestaurantId || 'Loading...'}</p>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Table Keys for Frontend Hash</p>
          <div className="grid gap-3 md:grid-cols-2">
            {form.tables.map((table) => (
              <div key={table.publicTableId} className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-3">
                <p className="font-headline font-bold text-on-surface">{table.label}</p>
                <p className="text-xs text-secondary">Hash example: `#restaurant={form.publicRestaurantId}&table={table.publicTableId}`</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>
    </div>
  );
}
