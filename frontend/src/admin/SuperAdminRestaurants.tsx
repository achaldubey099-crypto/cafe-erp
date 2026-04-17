import { useEffect, useState } from "react";
import API from "../lib/api";

type RestaurantRecord = {
  _id: string;
  brandName: string;
  slug: string;
  accessKey: string;
  publicRestaurantId: string;
  logoUrl?: string;
  owner?: { _id: string; name: string; email: string; status: "active" | "suspended" } | null;
};

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyRestaurantId, setBusyRestaurantId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [origin, setOrigin] = useState("");
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleCreate = async () => {
    try {
      setError("");
      setSuccess("");
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
      setSuccess("Cafe and owner credentials created successfully.");
      loadRestaurants();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create restaurant");
    }
  };

  const handleOwnerStatus = async (restaurant: RestaurantRecord, status: "active" | "suspended") => {
    try {
      setBusyRestaurantId(restaurant._id);
      setError("");
      setSuccess("");
      const res = await API.patch<{ message: string }>(`/superadmin/restaurants/${restaurant._id}/owner/status`, { status });
      setSuccess(res.data?.message || "Owner credentials updated");
      await loadRestaurants();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update owner credentials");
    } finally {
      setBusyRestaurantId("");
    }
  };

  const handleDeleteOwner = async (restaurant: RestaurantRecord) => {
    if (!window.confirm(`Delete owner credentials for ${restaurant.brandName}? This removes the login for that cafe owner.`)) {
      return;
    }

    try {
      setBusyRestaurantId(restaurant._id);
      setError("");
      setSuccess("");
      const res = await API.delete<{ message: string; restaurant: RestaurantRecord | null }>(`/superadmin/restaurants/${restaurant._id}/owner`);
      setRestaurants((current) =>
        res.data?.restaurant === null
          ? current.filter((entry) => entry._id !== restaurant._id)
          : current.map((entry) =>
              entry._id === restaurant._id
                ? {
                    ...entry,
                    owner: null,
                  }
                : entry
            )
      );
      setSuccess(res.data?.message || "Owner credentials deleted");
      await loadRestaurants();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete owner credentials");
    } finally {
      setBusyRestaurantId("");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <nav className="flex gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
          <span>Platform</span>
          <span>/</span>
          <span className="text-primary">Cafe Control</span>
        </nav>
        <h1 className="text-3xl font-headline font-extrabold text-on-surface">Superadmin Cafe Control</h1>
        <p className="text-secondary mt-1">Create cafes, assign owner credentials, and manage tenant access.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">{success}</div>}

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
                  <p className="text-xs text-secondary break-all">
                    Public cafe URL: {origin ? `${origin}/access/restaurant/${restaurant.accessKey}` : `/access/restaurant/${restaurant.accessKey}`}
                  </p>
                  <p className="text-sm text-secondary">
                    {restaurant.owner
                      ? `Owner: ${restaurant.owner.name}${restaurant.owner.email ? ` (${restaurant.owner.email})` : ""}`
                      : "No owner credentials"}
                  </p>
                  {restaurant.owner && (
                    <p className="mt-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          restaurant.owner.status === "suspended"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {restaurant.owner.status}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={!restaurant.owner || busyRestaurantId === restaurant._id}
                    onClick={() =>
                      handleOwnerStatus(
                        restaurant,
                        restaurant.owner?.status === "suspended" ? "active" : "suspended"
                      )
                    }
                    className="rounded-2xl border border-outline/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface disabled:opacity-50"
                  >
                    {busyRestaurantId === restaurant._id
                      ? "Updating..."
                      : restaurant.owner?.status === "suspended"
                        ? "Reactivate Owner"
                        : "Suspend Owner"}
                  </button>
                  <button
                    type="button"
                    disabled={!restaurant.owner || busyRestaurantId === restaurant._id}
                    onClick={() => handleDeleteOwner(restaurant)}
                    className="rounded-2xl bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-700 disabled:opacity-50"
                  >
                    {busyRestaurantId === restaurant._id ? "Working..." : "Delete Owner"}
                  </button>
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
