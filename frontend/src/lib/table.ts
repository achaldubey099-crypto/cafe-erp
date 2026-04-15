const TABLE_STORAGE_KEY = "tableId";
const SESSION_STORAGE_KEY = "sessionId";

function parseTableId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return Math.trunc(parsed);
}

export function syncTableIdFromSearch(search: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const queryTableId = parseTableId(new URLSearchParams(search).get("tableId"));
  if (!queryTableId) {
    return null;
  }

  const storedTableId = localStorage.getItem(TABLE_STORAGE_KEY);
  if (storedTableId !== String(queryTableId)) {
    localStorage.setItem(TABLE_STORAGE_KEY, String(queryTableId));
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return queryTableId;
}

export function getTableId() {
  if (typeof window === "undefined") {
    return null;
  }

  const queryTableId = syncTableIdFromSearch(window.location.search);
  if (queryTableId) {
    return queryTableId;
  }

  return parseTableId(localStorage.getItem(TABLE_STORAGE_KEY));
}
