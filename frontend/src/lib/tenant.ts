const RESTAURANT_STORAGE_KEY = "restaurantPublicId";
const TABLE_STORAGE_KEY = "tablePublicId";
const RESTAURANT_SLUG_KEY = "restaurantSlug";
const TABLE_SLUG_KEY = "tableSlug";
const RESTAURANT_ACCESS_KEY = "restaurantAccessKey";
const TABLE_ACCESS_KEY = "tableAccessKey";
const SESSION_STORAGE_KEY = "sessionId";
const RESERVED_PATHS = new Set([
  "access",
  "login",
  "cart",
  "checkout",
  "orders",
  "profile",
  "admin",
  "superadmin",
]);

type PathTenant = {
  restaurantAccessKey: string | null;
  tableAccessKey: string | null;
  restaurantSlug: string | null;
  tableSlug: string | null;
};

export type TenantContext = PathTenant & {
  restaurantPublicId: string | null;
  tablePublicId: string | null;
};

const readTenantContext = (): TenantContext => ({
  restaurantAccessKey: localStorage.getItem(RESTAURANT_ACCESS_KEY),
  tableAccessKey: localStorage.getItem(TABLE_ACCESS_KEY),
  restaurantSlug: localStorage.getItem(RESTAURANT_SLUG_KEY),
  tableSlug: localStorage.getItem(TABLE_SLUG_KEY),
  restaurantPublicId: localStorage.getItem(RESTAURANT_STORAGE_KEY),
  tablePublicId: localStorage.getItem(TABLE_STORAGE_KEY),
});

const updateTenantStorageValue = (storageKey: string, value: string | null | undefined) => {
  if (value === undefined) {
    return;
  }

  if (value) {
    localStorage.setItem(storageKey, value);
    return;
  }

  localStorage.removeItem(storageKey);
};

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
    localStorage.removeItem(RESTAURANT_SLUG_KEY);
    localStorage.removeItem(TABLE_SLUG_KEY);
    localStorage.removeItem(RESTAURANT_ACCESS_KEY);
    localStorage.removeItem(TABLE_ACCESS_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return { restaurant, table };
}

const parseTenantPath = (pathname: string): PathTenant | null => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "access") {
    if (segments[1] === "restaurant" && segments[2]) {
      return {
        restaurantAccessKey: segments[2],
        tableAccessKey: null,
        restaurantSlug: null,
        tableSlug: null,
      };
    }

    if (segments[1]) {
      return {
        restaurantAccessKey: null,
        tableAccessKey: segments[1],
        restaurantSlug: null,
        tableSlug: null,
      };
    }

    return null;
  }

  if (segments.length > 2) {
    return null;
  }

  const [restaurantSlug, tableSlug = null] = segments;
  if (RESERVED_PATHS.has(restaurantSlug)) {
    return null;
  }

  return {
    restaurantAccessKey: null,
    tableAccessKey: null,
    restaurantSlug,
    tableSlug,
  };
};

export function syncTenantFromLocation(pathname: string, hash: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const pathTenant = parseTenantPath(pathname);
  if (!pathTenant) {
    return syncTenantFromHash(hash);
  }

  const currentTenant = readTenantContext();
  const nextTenant: PathTenant = {
    restaurantAccessKey:
      pathTenant.restaurantAccessKey !== null
        ? pathTenant.restaurantAccessKey
        : pathTenant.tableAccessKey
          ? currentTenant.restaurantAccessKey
          : null,
    tableAccessKey: pathTenant.tableAccessKey,
    restaurantSlug:
      pathTenant.restaurantSlug !== null
        ? pathTenant.restaurantSlug
        : pathTenant.tableSlug
          ? currentTenant.restaurantSlug
          : null,
    tableSlug: pathTenant.tableSlug,
  };

  const hasChanged =
    currentTenant.restaurantAccessKey !== nextTenant.restaurantAccessKey ||
    currentTenant.tableAccessKey !== nextTenant.tableAccessKey ||
    currentTenant.restaurantSlug !== nextTenant.restaurantSlug ||
    currentTenant.tableSlug !== nextTenant.tableSlug;

  if (hasChanged) {
    updateTenantStorageValue(RESTAURANT_ACCESS_KEY, nextTenant.restaurantAccessKey);
    updateTenantStorageValue(TABLE_ACCESS_KEY, nextTenant.tableAccessKey);
    updateTenantStorageValue(RESTAURANT_SLUG_KEY, nextTenant.restaurantSlug);
    updateTenantStorageValue(TABLE_SLUG_KEY, nextTenant.tableSlug);

    localStorage.removeItem(RESTAURANT_STORAGE_KEY);
    localStorage.removeItem(TABLE_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return nextTenant;
}

export function getPublicRestaurantId() {
  if (typeof window === "undefined") return null;
  syncTenantFromLocation(window.location.pathname, window.location.hash);
  return localStorage.getItem(RESTAURANT_STORAGE_KEY);
}

export function getPublicTableId() {
  if (typeof window === "undefined") return null;
  syncTenantFromLocation(window.location.pathname, window.location.hash);
  return localStorage.getItem(TABLE_STORAGE_KEY);
}

export function getRestaurantSlug() {
  if (typeof window === "undefined") return null;
  syncTenantFromLocation(window.location.pathname, window.location.hash);
  return localStorage.getItem(RESTAURANT_SLUG_KEY);
}

export function getTableSlug() {
  if (typeof window === "undefined") return null;
  syncTenantFromLocation(window.location.pathname, window.location.hash);
  return localStorage.getItem(TABLE_SLUG_KEY);
}

export function getRestaurantAccessKey() {
  if (typeof window === "undefined") return null;
  syncTenantFromLocation(window.location.pathname, window.location.hash);
  return localStorage.getItem(RESTAURANT_ACCESS_KEY);
}

export function getTableAccessKey() {
  if (typeof window === "undefined") return null;
  syncTenantFromLocation(window.location.pathname, window.location.hash);
  return localStorage.getItem(TABLE_ACCESS_KEY);
}

export function getTenantContext() {
  if (typeof window === "undefined") {
    return {
      restaurantAccessKey: null,
      tableAccessKey: null,
      restaurantSlug: null,
      tableSlug: null,
      restaurantPublicId: null,
      tablePublicId: null,
    };
  }

  syncTenantFromLocation(window.location.pathname, window.location.hash);

  return readTenantContext();
}

export function mergeTenantContext(next: Partial<TenantContext>) {
  if (typeof window === "undefined") {
    return;
  }

  const currentTenant = readTenantContext();
  const mergedTenant: TenantContext = {
    ...currentTenant,
    ...next,
  };

  const hasChanged =
    currentTenant.restaurantAccessKey !== mergedTenant.restaurantAccessKey ||
    currentTenant.tableAccessKey !== mergedTenant.tableAccessKey ||
    currentTenant.restaurantSlug !== mergedTenant.restaurantSlug ||
    currentTenant.tableSlug !== mergedTenant.tableSlug ||
    currentTenant.restaurantPublicId !== mergedTenant.restaurantPublicId ||
    currentTenant.tablePublicId !== mergedTenant.tablePublicId;

  if (!hasChanged) {
    return;
  }

  updateTenantStorageValue(RESTAURANT_ACCESS_KEY, mergedTenant.restaurantAccessKey);
  updateTenantStorageValue(TABLE_ACCESS_KEY, mergedTenant.tableAccessKey);
  updateTenantStorageValue(RESTAURANT_SLUG_KEY, mergedTenant.restaurantSlug);
  updateTenantStorageValue(TABLE_SLUG_KEY, mergedTenant.tableSlug);
  updateTenantStorageValue(RESTAURANT_STORAGE_KEY, mergedTenant.restaurantPublicId);
  updateTenantStorageValue(TABLE_STORAGE_KEY, mergedTenant.tablePublicId);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getCustomerMenuPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  const tenant = getTenantContext();

  if (tenant.tableAccessKey) {
    return `/access/${tenant.tableAccessKey}`;
  }

  if (tenant.restaurantAccessKey) {
    return `/access/restaurant/${tenant.restaurantAccessKey}`;
  }

  if (tenant.restaurantSlug && tenant.tableSlug) {
    return `/${tenant.restaurantSlug}/${tenant.tableSlug}`;
  }

  if (tenant.restaurantSlug) {
    return `/${tenant.restaurantSlug}`;
  }

  return "/";
}

export function getOrCreateTenantSessionId() {
  if (typeof window === "undefined") return "";

  const tenant = getTenantContext();
  const table = tenant.tableAccessKey || tenant.tableSlug || tenant.tablePublicId;
  const restaurant = tenant.restaurantAccessKey || tenant.restaurantSlug || tenant.restaurantPublicId || "restaurant";
  if (!table) return "";

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
