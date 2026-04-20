import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Save, Upload } from 'lucide-react';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';

type RestaurantSettings = {
  brandName: string;
  slug: string;
  accessKey: string;
  logoUrl: string;
  description: string;
  publicRestaurantId: string;
  tables: Array<{ publicTableId: string; slug: string; accessKey: string; label: string; tableNumber: number }>;
};

type RestaurantSettingsResponse = {
  brandName: string;
  slug: string;
  accessKey: string;
  logoUrl?: string;
  description?: string;
  publicRestaurantId: string;
  tables: Array<{ publicTableId: string; slug: string; accessKey: string; label: string; tableNumber: number }>;
};

type RestaurantUpdateResponse = {
  restaurant: RestaurantSettingsResponse;
};

export default function AdminSettings() {
  const { login, user } = useAuth();
  const [form, setForm] = useState<RestaurantSettings>({
    brandName: '',
    slug: '',
    accessKey: '',
    logoUrl: '',
    description: '',
    publicRestaurantId: '',
    tables: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('https://placehold.co/200x200/png');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get<RestaurantSettingsResponse>('/admin/restaurant/me');
        setForm({
          brandName: res.data.brandName,
          slug: res.data.slug,
          accessKey: res.data.accessKey || '',
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (logoFile) {
      const objectUrl = URL.createObjectURL(logoFile);
      setLogoPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setLogoPreview(form.logoUrl || 'https://placehold.co/200x200/png');
  }, [form.logoUrl, logoFile]);

  const tableLinks = useMemo(
    () =>
      form.tables.map((table) => ({
        ...table,
        publicUrl: origin ? `${origin}/access/${table.accessKey}` : `/access/${table.accessKey}`,
      })),
    [form.tables, origin]
  );
  const allTableUrls = useMemo(
    () =>
      tableLinks
        .map((table) => `${table.label} (#${table.tableNumber}): ${table.publicUrl}`)
        .join('\n'),
    [tableLinks]
  );
  const cafePublicUrl = origin ? `${origin}/access/restaurant/${form.accessKey}` : `/access/restaurant/${form.accessKey}`;

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setError('');
      setMessage('Public URL copied.');
    } catch {
      setError('Failed to copy URL');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      const payload = new FormData();
      payload.append('brandName', form.brandName);
      payload.append('logoUrl', form.logoUrl);
      payload.append('description', form.description);
      if (logoFile) {
        payload.append('logoFile', logoFile);
      }
      const res = await API.patch<RestaurantUpdateResponse>('/admin/restaurant/me', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm((prev) => ({
        ...prev,
        brandName: res.data.restaurant.brandName,
        slug: res.data.restaurant.slug,
        accessKey: res.data.restaurant.accessKey || '',
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
      setLogoFile(null);
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
        <p className="text-secondary font-medium mt-1">Change your brand name, logo, and verify the protected public table links used by the QR flow.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}
      {message && <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-sm text-green-700">{message}</div>}

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline/5 space-y-6">
        <div className="grid md:grid-cols-[140px_1fr] gap-6 items-start">
          <img
            src={logoPreview}
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

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Upload Restaurant Image</label>
              <input
                id="restaurant-logo-file"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={loading}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="restaurant-logo-file"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-outline/10 bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface"
                >
                  <Upload size={14} />
                  Upload File
                </label>
                <span className="text-sm text-secondary">
                  {logoFile?.name || 'No file selected'}
                </span>
              </div>
              <p className="text-xs text-secondary">Upload a new image here if you do not want to use a logo URL.</p>
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
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Public Cafe URL</p>
          <p className="mt-2 font-mono text-sm text-on-surface break-all">{cafePublicUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyLink(cafePublicUrl)}
              className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
            >
              <Copy size={14} />
              Copy Cafe URL
            </button>
            <a
              href={cafePublicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
            >
              <ExternalLink size={14} />
              Open Cafe URL
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Table Links for Public Access</p>
          {tableLinks.length > 0 && (
            <div className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-headline font-bold text-on-surface">Final Public Table URLs</p>
                <button
                  type="button"
                  onClick={() => copyLink(allTableUrls)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
                >
                  <Copy size={14} />
                  Copy All URLs
                </button>
              </div>
              <textarea
                value={allTableUrls}
                readOnly
                className="w-full min-h-[140px] bg-white border-none rounded-2xl py-4 px-4 text-xs outline-none text-on-surface"
              />
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {tableLinks.length === 0 && (
              <div className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-3 text-sm text-secondary">
                No active tables found for this restaurant yet.
              </div>
            )}
            {tableLinks.map((table) => (
              <div key={table.publicTableId} className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-3 space-y-3">
                <p className="font-headline font-bold text-on-surface">
                  {table.label} <span className="text-secondary">#{table.tableNumber}</span>
                </p>
                <p className="text-xs text-secondary break-all">{table.publicUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(table.publicUrl)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
                  >
                    <Copy size={14} />
                    Copy URL
                  </button>
                  <a
                    href={table.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
                  >
                    <ExternalLink size={14} />
                    Open
                  </a>
                </div>
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
