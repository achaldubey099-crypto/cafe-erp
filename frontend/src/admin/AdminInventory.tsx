import React, { useEffect, useRef, useState } from 'react';
import { Package, AlertTriangle, Ban, Plus, Download, Search, Edit2, Trash2, X } from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import { createPaginationState } from '../lib/pagination';
import { cn } from '../lib/utils';
import API from '../lib/api';
import { PaginationMeta, Product } from '../types';

interface CreateMenuResponse {
  item: Product;
}

const DEFAULT_CATEGORY_OPTIONS = ['Coffee', 'Snacks', 'Desserts', 'Teas', 'Seasonal'];

const matchesInventorySearch = (product: Product, searchValue: string) => {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [product.name, product.category].some((value) =>
    String(value || '').toLowerCase().includes(normalizedSearch)
  );
};

export default function AdminInventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(createPaginationState(10));
  const [summary, setSummary] = useState({
    totalItems: 0,
    featuredItems: 0,
    withImageItems: 0,
  });
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Coffee',
    isFeatured: false,
  });
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => matchesInventorySearch(product, normalizedSearchTerm));
  const totalFilteredItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredItems / pagination.limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pagination.limit,
    currentPage * pagination.limit
  );
  const currentPagination: PaginationMeta = {
    page: currentPage,
    limit: pagination.limit,
    totalItems: totalFilteredItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
  const categoryOptions = Array.from(
    new Set(
      [...DEFAULT_CATEGORY_OPTIONS, ...products.map((product) => product.category), form.category]
        .map((category) => category.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get<Product[]>('/menu');
      const items = Array.isArray(res.data) ? res.data : [];
      setProducts(items);
      setSummary({
        totalItems: items.length,
        featuredItems: items.filter((item) => item.isFeatured).length,
        withImageItems: items.filter((item) => item.image).length,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load menu items');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const resetForm = () => {
    setForm({ name: '', price: '', category: 'Coffee', isFeatured: false });
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
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

  const exportInventoryToCsv = () => {
    const itemsToExport = filteredProducts;

    if (itemsToExport.length === 0) {
      setError('No inventory items are available to export');
      return;
    }

    const headers = ['name', 'category', 'price', 'isFeatured', 'image'];
    const escapeCsv = (value: string | number | boolean | undefined) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows = itemsToExport.map((product) =>
      [
        product.name,
        product.category,
        product.price,
        Boolean(product.isFeatured),
        product.image || '',
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSaveMenuItem = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const body = new FormData();
      body.append('name', form.name);
      body.append('price', form.price);
      body.append('category', form.category);
      body.append('isFeatured', String(form.isFeatured));

      if (imageFile) {
        body.append('imageFile', imageFile);
      }

      if (editingId) {
        await API.put<CreateMenuResponse>(`/menu/${editingId}`, body);
      } else {
        await API.post<CreateMenuResponse>('/menu', body);
      }

      setMessage(editingId ? 'Menu item updated.' : 'Menu item created.');
      closeModal();
      setPage(1);
      await loadMenu();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError('Choose a CSV file first');
      return;
    }

    try {
      setCsvUploading(true);
      setError('');
      setMessage('');

      const body = new FormData();
      body.append('file', csvFile);

      const res = await API.post<{ message: string; count: number }>('/menu/bulk-upload', body, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCsvFile(null);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
      setMessage(res.data?.message ? `${res.data.message} (${res.data.count} items)` : 'CSV imported successfully.');
      setPage(1);
      await loadMenu();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleDeleteMenuItem = async (product: Product) => {
    const confirmed = window.confirm(`Delete "${product.name}" from the menu?`);

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setMessage('');

      await API.delete(`/menu/${product._id}`);
      setMessage('Menu item deleted.');
      const nextPage = paginatedProducts.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== page) {
        setPage(nextPage);
      }
      await loadMenu();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to delete menu item');
    }
  };
  
  const stats = [
    { label: "Menu Items", value: String(summary.totalItems), sub: loading ? "Loading..." : "Across all pages", icon: Package, color: "primary" },
    { label: "Favorites Ready", value: String(summary.withImageItems), sub: "With images", icon: AlertTriangle, color: "secondary" },
    { label: "Featured", value: String(summary.featuredItems), sub: "Highlighted items", icon: Ban, color: "secondary" },
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

      {message && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
          {message}
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
      <div className="grid xl:grid-cols-[1.4fr_0.9fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-outline/10 overflow-hidden">
        <div className="p-6 border-b border-outline/5 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search by item or category..."
              className="w-full bg-surface-container border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportInventoryToCsv}
              className="p-2.5 rounded-xl border border-outline/20 text-secondary hover:bg-surface-container transition-all"
              aria-label="Download inventory CSV"
            >
              <Download size={18} />
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
              ) : paginatedProducts.length > 0 ? paginatedProducts.map((product) => (
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
                    <span
                      title={product.category}
                      className="inline-flex max-w-[14rem] whitespace-normal break-words rounded-full bg-surface-container px-3 py-1 text-center text-xs font-bold leading-tight text-secondary"
                    >
                      {product.category}
                    </span>
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
                        className="p-2 rounded-lg text-secondary hover:bg-surface-container hover:text-primary transition-all"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMenuItem(product)}
                        className="p-2 rounded-lg text-secondary hover:bg-red-50 hover:text-red-600 transition-all"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={16} />
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
        <PaginationControls
          pagination={currentPagination}
          itemLabel="menu items"
          disabled={loading}
          onPageChange={setPage}
          onLimitChange={(limit) => {
            setPagination((current) => ({ ...current, limit }));
            setPage(1);
          }}
        />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-outline/10 p-6 space-y-4 h-fit">
          <div>
            <h3 className="text-xl font-headline font-extrabold text-primary">Bulk Upload Menu CSV</h3>
            <p className="text-sm text-secondary mt-1">
              Upload one CSV and it will add menu items directly to this cafe.
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="inventory-csv-file-input"
                className="inline-flex cursor-pointer items-center rounded-full border border-outline/15 bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-surface-container"
              >
                Choose File
              </label>
              <span className="text-sm text-secondary">
                {csvFile?.name || 'No file selected'}
              </span>
            </div>
            <input
              ref={csvInputRef}
              id="inventory-csv-file-input"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4 text-xs text-secondary space-y-2">
            <p className="font-bold uppercase tracking-widest text-[10px] text-secondary">CSV Columns</p>
            <p>`name`, `price`, `category`, `image`, `imageUrl`, or `image_url`, optional `isFeatured`</p>
            <p>Use direct image URLs in the CSV if you want items to appear with images immediately.</p>
          </div>

          <button
            type="button"
            onClick={handleCsvUpload}
            disabled={csvUploading || !csvFile}
            className="w-full rounded-2xl bg-primary text-on-primary py-4 font-headline font-bold disabled:opacity-50"
          >
            {csvUploading ? 'Uploading CSV...' : 'Import CSV to Cafe'}
          </button>
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
                    <input
                      list="inventory-category-options"
                      type="text"
                      value={form.category}
                      onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                      placeholder="e.g. Signature Specials"
                      required
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <datalist id="inventory-category-options">
                      {categoryOptions.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
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
                  <div className="rounded-2xl bg-surface-container-low px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        htmlFor="inventory-image-file-input"
                        className="inline-flex cursor-pointer items-center rounded-full border border-outline/15 bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-surface-container"
                      >
                        Choose File
                      </label>
                      <span className="text-sm text-secondary">
                        {imageFile?.name || 'No file selected'}
                      </span>
                    </div>
                    <input
                      ref={imageInputRef}
                      id="inventory-image-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </div>
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
