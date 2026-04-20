import React, { useState, useEffect } from "react";
import { Search, Heart, Plus, Minus, Bell, LogIn, LogOut, ShoppingCart } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";

import API from "../lib/api";
import { setTableId } from "../lib/table";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getCustomerMenuPath, getTenantContext, mergeTenantContext } from "../lib/tenant";

interface FavoriteResponse {
  _id: string;
  itemId: string | { _id: string };
}

interface ToggleFavoriteResponse {
  favorite?: FavoriteResponse;
}

interface PublicRestaurantEntryResponse {
  restaurant?: {
    brandName?: string;
    slug?: string;
    accessKey?: string;
  };
  firstTable?: {
    accessKey?: string;
    url?: string;
    slug?: string;
    publicTableId?: string;
  } | null;
}

interface PublicMenuResponse {
  restaurant?: {
    brandName?: string;
    slug?: string;
    accessKey?: string;
    publicRestaurantId?: string;
  };
  table?: {
    label?: string;
    tableNumber?: number;
    accessKey?: string;
    slug?: string;
    publicTableId?: string;
  };
  menu?: Product[];
  menuItems?: Product[];
}

const cropCloudinaryImage = (url = "", width: number, height: number) => {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  return url.replace(
    "/image/upload/",
    `/image/upload/c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/`
  );
};

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurantName, setRestaurantName] = useState("Cafe");
  const [tableLabel, setTableLabel] = useState("");
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  const { addToCart, removeFromCart, cart } = useCart();
  const { customer, logoutCustomer } = useAuth();
  const isLoggedIn = !!customer;
  const [categories, setCategories] = useState([]);
  const tenantContext = getTenantContext();
  const tableAccessKey = tenantContext.tableAccessKey || tenantContext.tableSlug || tenantContext.tablePublicId;

  // 🔥 Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams(window.location.search);
        const publicRestaurantFromSearch = searchParams.get("restaurant") || searchParams.get("restaurantId") || searchParams.get("r");
        const publicTableFromSearch = searchParams.get("table") || searchParams.get("tableId") || searchParams.get("t");
        const tenant = getTenantContext();

        const publicRestaurant =
          tenant.restaurantPublicId ||
          publicRestaurantFromSearch ||
          localStorage.getItem("restaurantPublicId") ||
          null;

        const publicTable =
          tenant.tablePublicId ||
          publicTableFromSearch ||
          localStorage.getItem("tablePublicId") ||
          null;

        const restaurantAccessKey = tenant.restaurantAccessKey || null;
        const tableAccessKey = tenant.tableAccessKey || null;
        const restaurantSlug = tenant.restaurantSlug || null;
        const tableSlug = tenant.tableSlug || null;

        if (!tableAccessKey && !restaurantAccessKey && !restaurantSlug && !publicRestaurant) {
          throw new Error("Restaurant access key not found");
        }

        const shouldResolveRestaurantEntry =
          (!tableAccessKey && !!restaurantAccessKey) ||
          (!tableSlug && !!restaurantSlug);

        if (shouldResolveRestaurantEntry) {
          const entryRes = await API.get<PublicRestaurantEntryResponse>("/menu/entry", {
            params: restaurantAccessKey ? { restaurantAccessKey } : { restaurantSlug },
          });

          setRestaurantName(entryRes.data?.restaurant?.brandName || "Cafe");
          mergeTenantContext({
            restaurantAccessKey: entryRes.data?.restaurant?.accessKey || restaurantAccessKey,
            restaurantSlug: entryRes.data?.restaurant?.slug || restaurantSlug,
          });

          const firstTableUrl = entryRes.data?.firstTable?.url;
          if (firstTableUrl && firstTableUrl !== location.pathname) {
            navigate(firstTableUrl, { replace: true });
            return;
          }

          if (!firstTableUrl) {
            throw new Error("No active tables found for this restaurant");
          }
        }

        const params: Record<string, string> = {};
        if (restaurantAccessKey) params.restaurantAccessKey = restaurantAccessKey;
        if (tableAccessKey) params.tableAccessKey = tableAccessKey;
        if (restaurantSlug) params.restaurantSlug = restaurantSlug;
        if (tableSlug) params.tableSlug = tableSlug;
        if (publicRestaurant) params.restaurant = publicRestaurant;
        if (publicTable) params.table = publicTable;

        const res = await API.get<PublicMenuResponse>("/menu/access", { params });
        const data = res.data || {};
        const menuData = Array.isArray(data) ? data : data.menu || data.menuItems || [];

        const resolvedRestaurantAccessKey =
          data.restaurant?.accessKey || tenant.restaurantAccessKey || restaurantAccessKey;
        const resolvedTableLabel = data.table?.label || "";
        const resolvedTableNumber =
          typeof data.table?.tableNumber === "number" && data.table.tableNumber > 0
            ? data.table.tableNumber
            : null;

        // If we somehow land in a protected menu route without a resolved table payload,
        // bounce back through the restaurant entry endpoint to recover the first valid table URL.
        if (
          tableAccessKey &&
          resolvedRestaurantAccessKey &&
          !resolvedTableLabel &&
          menuData.length === 0
        ) {
          const entryRes = await API.get<PublicRestaurantEntryResponse>("/menu/entry", {
            params: { restaurantAccessKey: resolvedRestaurantAccessKey },
          });

          const fallbackTableUrl = entryRes.data?.firstTable?.url;
          if (fallbackTableUrl && fallbackTableUrl !== location.pathname) {
            navigate(fallbackTableUrl, { replace: true });
            return;
          }
        }

        mergeTenantContext({
          restaurantAccessKey: resolvedRestaurantAccessKey,
          tableAccessKey: data.table?.accessKey || tenant.tableAccessKey,
          restaurantSlug: data.restaurant?.slug || tenant.restaurantSlug,
          tableSlug: data.table?.slug || tenant.tableSlug,
          restaurantPublicId: data.restaurant?.publicRestaurantId || tenant.restaurantPublicId,
          tablePublicId: data.table?.publicTableId || tenant.tablePublicId,
        });

        setProducts(menuData);
        setRestaurantName(data.restaurant?.brandName || "Cafe");
        setTableLabel(resolvedTableLabel);
        setTableNumber(resolvedTableNumber);
        setTableId(resolvedTableNumber);

        const uniqueCategories = [...new Set((menuData || []).map((item) => item.category))].sort();
        setCategories(["All", ...uniqueCategories]);
        setActiveCategory("All");
      } catch (err: any) {
        console.error("❌ MENU FETCH ERROR:", err);
        setProducts([]);
        setCategories([]);
        setError(err?.response?.data?.message || err?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [location.pathname, location.hash, location.search, navigate]);


  // Fetch user favorites if logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchFavorites = async () => {
      try {
        const res = await API.get<FavoriteResponse[]>('/favorites', { params: { userId: customer?._id } });
        const favIds = (res.data || []).map((f: any) => (f.itemId?._id || f.itemId));
        setFavorites(favIds);
      } catch (err) {
        console.error('Failed to load favorites', err);
      }
    };

    fetchFavorites();
  }, [customer?._id, isLoggedIn]);

  const handleToggleFavorite = async (product: Product) => {
    if (!isLoggedIn) {
      navigate(`/login?returnTo=${encodeURIComponent(getCustomerMenuPath())}`);
      return;
    }

    const itemId = product._id;
    const currentlyFavorited = favorites.includes(itemId);

    // Optimistic UI
    setFavorites((prev) => (currentlyFavorited ? prev.filter((id) => id !== itemId) : [...prev, itemId]));

    try {
      const res = await API.post<ToggleFavoriteResponse>('/favorites', {
        userId: customer?._id,
        itemId,
        name: product.name,
        price: product.price,
        image: product.image,
      });

      // If backend indicates removal (no favorite in response), ensure removed
      if (!res.data.favorite) {
        setFavorites((prev) => prev.filter((id) => id !== itemId));
      } else {
        // ensure it's present
        setFavorites((prev) => Array.from(new Set([...prev, itemId])));
      }
    } catch (err) {
      console.error('Favorite toggle failed', err);
      // revert optimistic
      setFavorites((prev) => (currentlyFavorited ? [...prev, itemId] : prev.filter((id) => id !== itemId)));
      alert(err?.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const getCartQuantity = (productId: string) => {
    return cart.find((item) => item._id === productId)?.quantity || 0;
  };

  const handleLogout = () => {
    logoutCustomer();
    setFavorites([]);
    navigate(getCustomerMenuPath());
  };

 // 🔥 Filtering logic (FINAL FIXED)
const featuredProduct = products.find((p) => p.isFeatured);
const hasActiveSearch = searchTerm.trim().length > 0;
const tableDisplay = tableNumber ? `Table #${tableNumber}` : tableLabel || (tableAccessKey ? "Protected Table Access" : "QR Ordering");

// Combine category filtering with search (case-insensitive)
const filteredProducts = products.filter((p) => {
  const term = searchTerm.trim().toLowerCase();
  const matchesSearch = !term || (p.name || "").toLowerCase().includes(term);

  const matchesCategory =
    activeCategory === "All" || !activeCategory
      ? true
      : p.category.toLowerCase() === activeCategory.toLowerCase();

  return matchesCategory && matchesSearch;
});

  // 🔥 Cart calculations
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // ✅ Loading UI
  if (loading) {
    return <div className="p-6 text-center">Loading menu...</div>;
  }

  // ✅ Error UI
  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="pb-44">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary font-headline tracking-tight">
              {restaurantName}
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">
              {tableDisplay}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm font-bold text-primary hover:bg-surface-container-high active:scale-95 transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate(`/login?returnTo=${encodeURIComponent(getCustomerMenuPath())}`)}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-on-primary shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                <LogIn size={16} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24">
        {tableAccessKey && (
          <section className="px-6 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {tableDisplay}
            </div>
          </section>
        )}

        {/* Search */}
        <section className="px-6 mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-outline" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your favorite brew..."
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/60 font-medium transition-all outline-none"
            />
          </div>
        </section>

        {/* Featured */}
        {featuredProduct && !hasActiveSearch && (
          <section className="px-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[5/2] rounded-lg overflow-hidden group"
            >
              <img
                src={cropCloudinaryImage(featuredProduct.image, 1200, 480)}
                alt={featuredProduct.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block bg-on-primary-container text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded mb-2">
                  Editor's Choice
                </span>
                <h3 className="text-white font-headline text-xl font-bold leading-tight">
                  {featuredProduct.name}
                </h3>
                <p className="text-white/80 text-xs mt-1">
                  {featuredProduct.description}
                </p>
              </div>
            </motion.div>
          </section>
        )}

        {/* Categories */}
        <section className="mb-8">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 px-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex-none px-6 py-2.5 rounded-full font-headline font-bold text-sm transition-all active:scale-95",
                  activeCategory === cat
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section className="px-6 pb-20">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              {activeCategory} Menu
            </h2>
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest pb-1">
              {filteredProducts.length} Items
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-outline/10 bg-white p-8 text-center text-sm text-secondary shadow-sm">
              {hasActiveSearch
                ? `No menu items found for "${searchTerm.trim()}".`
                : `No menu items are available in ${activeCategory}.`}
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-low mb-3 p-4">
                  <img
                    src={cropCloudinaryImage(product.image, 640, 640)}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg shadow-sm transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => handleToggleFavorite(product)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform"
                  >
                    {favorites.includes(product._id) ? (
                      <Heart size={16} fill="currentColor" className="text-red-500" />
                    ) : (
                      <Heart size={16} />
                    )}
                  </button>
                </div>

                <div className="px-1">
                  <h4 className="font-headline font-bold text-on-surface leading-tight">
                    {product.name}
                  </h4>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-headline font-extrabold text-primary">
                      ₹{product.price}
                    </span>

                    {getCartQuantity(product._id) > 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-primary text-on-primary px-2 py-1 shadow-md shadow-primary/20">
                        <button
                          onClick={() => removeFromCart(product._id)}
                          className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-5 text-center text-sm font-bold">
                          {getCartQuantity(product._id)}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-primary text-on-primary p-2 rounded-lg active:scale-90 transition-transform shadow-md shadow-primary/20"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </section>
      </main>

      {/* Floating Cart Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/cart")}
          className="flex items-center gap-3 bg-primary text-on-primary px-5 py-4 rounded-3xl shadow-2xl shadow-primary/40"
        >
          <ShoppingCart size={20} fill="currentColor" />
          <span className="font-headline font-bold text-sm">
            {totalItems} items • ₹{totalPrice}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
