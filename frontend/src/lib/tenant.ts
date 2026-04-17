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

  const currentTenant: PathTenant = {
    restaurantAccessKey: localStorage.getItem(RESTAURANT_ACCESS_KEY),
    tableAccessKey: localStorage.getItem(TABLE_ACCESS_KEY),
    restaurantSlug: localStorage.getItem(RESTAURANT_SLUG_KEY),
    tableSlug: localStorage.getItem(TABLE_SLUG_KEY),
  };

  const hasChanged =
    currentTenant.restaurantAccessKey !== pathTenant.restaurantAccessKey ||
    currentTenant.tableAccessKey !== pathTenant.tableAccessKey ||
    currentTenant.restaurantSlug !== pathTenant.restaurantSlug ||
    currentTenant.tableSlug !== pathTenant.tableSlug;

  if (hasChanged) {
    if (pathTenant.restaurantAccessKey) {
      localStorage.setItem(RESTAURANT_ACCESS_KEY, pathTenant.restaurantAccessKey);
    } else {
      localStorage.removeItem(RESTAURANT_ACCESS_KEY);
    }

    if (pathTenant.tableAccessKey) {
      localStorage.setItem(TABLE_ACCESS_KEY, pathTenant.tableAccessKey);
    } else {
      localStorage.removeItem(TABLE_ACCESS_KEY);
    }

    if (pathTenant.restaurantSlug) {
      localStorage.setItem(RESTAURANT_SLUG_KEY, pathTenant.restaurantSlug);
    } else {
      localStorage.removeItem(RESTAURANT_SLUG_KEY);
    }

    if (pathTenant.tableSlug) {
      localStorage.setItem(TABLE_SLUG_KEY, pathTenant.tableSlug);
    } else {
      localStorage.removeItem(TABLE_SLUG_KEY);
    }

    localStorage.removeItem(RESTAURANT_STORAGE_KEY);
    localStorage.removeItem(TABLE_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return pathTenant;
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

  return {
    restaurantAccessKey: localStorage.getItem(RESTAURANT_ACCESS_KEY),
    tableAccessKey: localStorage.getItem(TABLE_ACCESS_KEY),
    restaurantSlug: localStorage.getItem(RESTAURANT_SLUG_KEY),
    tableSlug: localStorage.getItem(TABLE_SLUG_KEY),
    restaurantPublicId: localStorage.getItem(RESTAURANT_STORAGE_KEY),
    tablePublicId: localStorage.getItem(TABLE_STORAGE_KEY),
  };
}

export function getOrCreateTenantSessionId() {
  if (typeof window === "undefined") return "";

  const tenant = getTenantContext();
  const restaurant = tenant.restaurantAccessKey || tenant.restaurantSlug || tenant.restaurantPublicId;
  const table = tenant.tableAccessKey || tenant.tableSlug || tenant.tablePublicId;
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
