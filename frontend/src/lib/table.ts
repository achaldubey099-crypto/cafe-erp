const TABLE_STORAGE_KEY = "tableId";
const DEFAULT_TABLE_ID = 1;

export function getTableId() {
  if (typeof window === "undefined") {
    return DEFAULT_TABLE_ID;
  }

  const queryTableId = new URLSearchParams(window.location.search).get("tableId");
  if (queryTableId) {
    const parsed = Number(queryTableId);
    const tableId = Number.isNaN(parsed) ? DEFAULT_TABLE_ID : parsed;
    localStorage.setItem(TABLE_STORAGE_KEY, String(tableId));
    return tableId;
  }

  const storedTableId = localStorage.getItem(TABLE_STORAGE_KEY);
  if (storedTableId) {
    const parsed = Number(storedTableId);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  localStorage.setItem(TABLE_STORAGE_KEY, String(DEFAULT_TABLE_ID));
  return DEFAULT_TABLE_ID;
}