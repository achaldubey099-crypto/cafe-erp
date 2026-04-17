const TABLE_STORAGE_KEY = "tableId";
const SESSION_STORAGE_KEY = "sessionId";
const TABLE_ACCESS_KEY_STORAGE_KEY = "tableAccessKey";
const TABLE_SLUG_STORAGE_KEY = "tableSlug";

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

  const storedTableId = parseTableId(localStorage.getItem(TABLE_STORAGE_KEY));
  if (storedTableId) {
    return storedTableId;
  }

  const accessKey = localStorage.getItem(TABLE_ACCESS_KEY_STORAGE_KEY) || "";
  const accessKeyMatch = accessKey.match(/(\d+)$/);
  if (accessKeyMatch) {
    return parseTableId(accessKeyMatch[1]);
  }

  const tableSlug = localStorage.getItem(TABLE_SLUG_STORAGE_KEY) || "";
  const slugMatch = tableSlug.match(/(\d+)$/);
  if (slugMatch) {
    return parseTableId(slugMatch[1]);
  }

  return null;
}
