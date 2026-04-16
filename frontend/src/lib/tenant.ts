const RESTAURANT_STORAGE_KEY = "restaurantPublicId";
const TABLE_STORAGE_KEY = "tablePublicId";
const SESSION_STORAGE_KEY = "sessionId";

const parseHashValue = (hash: string, key: string) => {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(trimmed);
  return params.get(key);
};

export function syncTenantFromHash(hash: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const restaurant = parseHashValue(hash, "restaurant") || parseHashValue(hash, "r");
  const table = parseHashValue(hash, "table") || parseHashValue(hash, "t");

  if (!restaurant || !table) {
    return null;
  }

  const currentRestaurant = localStorage.getItem(RESTAURANT_STORAGE_KEY);
  const currentTable = localStorage.getItem(TABLE_STORAGE_KEY);

  if (currentRestaurant !== restaurant || currentTable !== table) {
    localStorage.setItem(RESTAURANT_STORAGE_KEY, restaurant);
    localStorage.setItem(TABLE_STORAGE_KEY, table);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return { restaurant, table };
}

export function getPublicRestaurantId() {
  if (typeof window === "undefined") return null;
  syncTenantFromHash(window.location.hash);
  return localStorage.getItem(RESTAURANT_STORAGE_KEY);
}

export function getPublicTableId() {
  if (typeof window === "undefined") return null;
  syncTenantFromHash(window.location.hash);
  return localStorage.getItem(TABLE_STORAGE_KEY);
}

export function getOrCreateTenantSessionId() {
  if (typeof window === "undefined") return "";

  const restaurant = getPublicRestaurantId();
  const table = getPublicTableId();
  if (!restaurant || !table) return "";

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}_${restaurant}_${table}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

export function clearTenantSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
