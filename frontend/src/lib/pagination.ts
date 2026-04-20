import { PaginationMeta } from "../types";

export const createPaginationState = (limit = 10): PaginationMeta => ({
  page: 1,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});
