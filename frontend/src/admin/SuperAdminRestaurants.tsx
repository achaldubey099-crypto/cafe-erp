import { useEffect, useState } from "react";
import API from "../lib/api";

type RestaurantRecord = {
  _id: string;
  brandName: string;
  publicRestaurantId: string;
  logoUrl?: string;
  owner?: { _id: string; name: string; email: string } | null;
};

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    brandName: "",
    logoUrl: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    tableCount: "8",
  });

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const res = await API.get<RestaurantRecord[]>("/superadmin/restaurants");
      setRestaurants(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleCreate = async () => {
    try {
      setError("");
      await API.post("/superadmin/restaurants", {
        ...form,
        tableCount: Number(form.tableCount),
      });
      setForm({
        brandName: "",
        logoUrl: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        tableCount: "8",
      });
      loadRestaurants();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create restaurant");
    }
  };

  return (
    <div className="min-h-screen bg-background px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-extrabold text-on-surface">Superadmin Cafe Control</h1>
        <p className="text-secondary mt-1">Create cafes, assign owner credentials, and manage tenant access.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <section className="bg-white rounded-3xl border border-outline/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline/10">
            <h2 className="text-xl font-headline font-bold text-primary">Restaurants</h2>
          </div>
          <div className="divide-y divide-outline/10">
            {loading ? (
              <div className="p-6 text-secondary">Loading cafes...</div>
            ) : restaurants.map((restaurant) => (
              <div key={restaurant._id} className="p-6 flex items-center gap-4">
                <img
                  src={restaurant.logoUrl || "https://placehold.co/120x120/png"}
                  alt={restaurant.brandName}
                  className="w-14 h-14 rounded-2xl object-cover bg-surface-container"
                />
                <div className="flex-1">
                  <p className="font-headline font-bold text-on-surface">{restaurant.brandName}</p>
                  <p className="text-xs text-secondary">Public restaurant key: {restaurant.publicRestaurantId}</p>
                  <p className="text-sm text-secondary">
                    Owner: {restaurant.owner?.name || "Unassigned"} {restaurant.owner?.email ? `(${restaurant.owner.email})` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-outline/10 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-headline font-bold text-primary">Add New Cafe</h2>
          {[
            ["brandName", "Cafe brand name"],
            ["logoUrl", "Logo URL"],
            ["ownerName", "Owner name"],
            ["ownerEmail", "Owner email"],
            ["ownerPassword", "Owner password"],
            ["tableCount", "Table count"],
          ].map(([key, label]) => (
            <input
              key={key}
              type={key.toLowerCase().includes("password") ? "password" : key === "ownerEmail" ? "email" : "text"}
              placeholder={label}
              value={(form as any)[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm outline-none"
            />
          ))}
          <button
            type="button"
            onClick={handleCreate}
            className="w-full bg-primary text-on-primary py-4 rounded-2xl font-headline font-bold"
          >
            Create Cafe + Owner
          </button>
        </section>
      </div>
    </div>
  );
}
