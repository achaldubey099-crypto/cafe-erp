const slugifySegment = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildDefaultTableSlug = (label, tableNumber) => {
  const labelSlug = slugifySegment(label);
  if (labelSlug) {
    return labelSlug;
  }

  if (tableNumber !== undefined && tableNumber !== null && tableNumber !== "") {
    return `table-${tableNumber}`;
  }

  return "table-access";
};

const getTableSlug = (table) => slugifySegment(table?.slug) || buildDefaultTableSlug(table?.label, table?.tableNumber);

module.exports = {
  slugifySegment,
  buildDefaultTableSlug,
  getTableSlug,
};
