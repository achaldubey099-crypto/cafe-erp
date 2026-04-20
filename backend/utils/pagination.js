const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const getPaginationParams = (
  query,
  { defaultPage = DEFAULT_PAGE, defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}
) => {
  const page = parsePositiveInteger(query.page, defaultPage);
  const rawLimit = parsePositiveInteger(query.limit, defaultLimit);
  const limit = Math.min(rawLimit, maxLimit);
  const shouldPaginate =
    String(query.paginate || "").toLowerCase() === "true" ||
    query.page !== undefined ||
    query.limit !== undefined;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    shouldPaginate,
  };
};

const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / limit));

  return {
    page,
    limit,
    totalItems: safeTotalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
  getPaginationParams,
  buildPaginationMeta,
  escapeRegex,
};
