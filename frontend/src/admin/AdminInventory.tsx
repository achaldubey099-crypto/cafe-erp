import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, Ban, Plus, Download, Filter, Edit2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import API from '../lib/api';
import { Product } from '../types';

interface CreateMenuResponse {
  item: Product;
}

export default function AdminInventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Coffee',
    isFeatured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get<Product[]>('/menu');
      setProducts(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const resetForm = () => {
    setForm({ name: '', price: '', category: 'Coffee', isFeatured: false });
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      isFeatured: !!product.isFeatured,
    });
    setImageFile(null);
    setImagePreview(product.image || '');
    setIsModalOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSaveMenuItem = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const body = new FormData();
      body.append('name', form.name);
      body.append('price', form.price);
      body.append('category', form.category);
      body.append('isFeatured', String(form.isFeatured));

      if (imageFile) {
        body.append('imageFile', imageFile);
      }

      const res = editingId
        ? await API.put<CreateMenuResponse>(`/menu/${editingId}`, body)
        : await API.post<CreateMenuResponse>('/menu', body);

      setProducts((prev) => (
        editingId
          ? prev.map((item) => (item._id === editingId ? res.data.item : item))
          : [res.data.item, ...prev]
      ));
      closeModal();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };
  
  const stats = [
    { label: "Menu Items", value: String(products.length), sub: loading ? "Loading..." : "Live menu", icon: Package, color: "primary" },
    { label: "Favorites Ready", value: String(products.filter((item) => item.image).length), sub: "With images", icon: AlertTriangle, color: "secondary" },
    { label: "Featured", value: String(products.filter((item) => item.isFeatured).length), sub: "Highlighted items", icon: Ban, color: "secondary" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary font-headline">Inventory Management</h2>
          <p className="text-on-surface-variant mt-1 font-medium">Keep track of your artisan supplies and café essentials.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      {/* Stats */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={cn(
            "p-6 rounded-3xl border shadow-sm",
            stat.color === 'red' ? "bg-red-50 border-red-100" : "bg-white border-outline/10"
          )}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-3 rounded-2xl",
                stat.color === 'red' ? "bg-red-100 text-red-600" : "bg-surface-container text-primary"
              )}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-4xl font-extrabold font-headline",
                stat.color === 'red' ? "text-red-600" : "text-on-surface"
              )}>{stat.value}</span>
              <span className="text-xs font-medium text-secondary">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-outline/10 overflow-hidden">
        <div className="p-6 border-b border-outline/5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <select className="bg-surface-container border-none rounded-xl py-2.5 px-4 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none">
              <option>All Categories</option>
              <option>Coffee Beans</option>
              <option>Dairy & Alt</option>
              <option>Pastries</option>
            </select>
            <select className="bg-surface-container border-none rounded-xl py-2.5 px-4 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none">
              <option>All Status</option>
              <option>In Stock</option>
              <option>Low Stock</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl border border-outline/20 text-secondary hover:bg-surface-container transition-all">
              <Download size={18} />
            </button>
            <button className="p-2.5 rounded-xl border border-outline/20 text-secondary hover:bg-surface-container transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline/5">
                <th className="py-4 px-8 text-[10px] font-bold text-secondary uppercase tracking-widest">Item Name</th>
                <th className="py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Category</th>
                <th className="py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Stock</th>
                <th className="py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Status</th>
                <th className="py-4 px-8 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 px-8 text-center text-secondary">Loading menu items...</td>
                </tr>
              ) : products.length > 0 ? products.map((product) => (
                <tr key={product.id ?? product._id} className="group hover:bg-surface-container-low/30 transition-all">
                  <td className="py-4 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container border border-outline/5">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{product.name}</div>
                        <div className="text-[10px] text-secondary font-bold uppercase tracking-tighter">SKU: ART-{(product.id ?? product._id).padStart(3, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-bold text-secondary px-3 py-1 bg-surface-container rounded-full">{product.category}</span>
                  </td>
                  <td className="py-4 px-6 font-headline font-bold text-on-surface">₹{product.price}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                      In Stock
                    </span>
                  </td>
                  <td className="py-4 px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="text-[10px] font-bold text-primary hover:underline px-2 py-1"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-2 rounded-lg text-secondary hover:bg-surface-container hover:text-primary transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 px-8 text-center text-secondary">No menu items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-headline font-extrabold text-primary">
                    {editingId ? 'Update Menu Item' : 'Add New Item'}
                  </h3>
                  <p className="text-secondary text-sm font-medium">
                    {editingId ? 'Update the menu item details for your cafe.' : 'Enter the details for the new inventory item.'}
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-surface-container rounded-full transition-colors"
                >
                  <X size={24} className="text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSaveMenuItem} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Menu Item Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Iced Latte"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                    >
                      <option>Coffee</option>
                      <option>Snacks</option>
                      <option>Desserts</option>
                      <option>Teas</option>
                      <option>Seasonal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Price</label>
                    <input 
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 180"
                      value={form.price}
                      onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                      required
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Menu Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Selected menu item" className="h-28 w-full object-cover rounded-2xl" />
                  )}
                </div>

                <label className="flex items-center gap-3 text-sm font-bold text-secondary">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                  />
                  Mark as featured
                </label>

                <div className="rounded-2xl bg-surface-container-low p-4 text-xs text-secondary">
                  Images are uploaded to Cloudinary and saved on the menu item as a URL.
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 bg-surface-container text-secondary rounded-2xl font-headline font-bold hover:bg-surface-container-high transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-4 bg-primary text-on-primary rounded-2xl font-headline font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update Item' : 'Save Item'}
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
