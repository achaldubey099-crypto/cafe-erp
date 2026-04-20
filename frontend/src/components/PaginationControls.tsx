import { ChevronLeft, ChevronRight } from "lucide-react";

import { PaginationMeta } from "../types";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  itemLabel?: string;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}

export default function PaginationControls({
  pagination,
  itemLabel = "items",
  disabled = false,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
}: PaginationControlsProps) {
  const from = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.totalItems, pagination.page * pagination.limit);

  return (
    <div className="flex flex-col gap-4 border-t border-outline/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-xs font-medium text-secondary">
        {pagination.totalItems === 0
          ? `No ${itemLabel} found`
          : `Showing ${from}-${to} of ${pagination.totalItems} ${itemLabel}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {onLimitChange && (
          <label className="flex items-center gap-2 text-xs font-medium text-secondary">
            <span>Rows</span>
            <select
              value={pagination.limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              disabled={disabled}
              className="rounded-xl border border-outline/20 bg-white px-3 py-2 text-xs font-bold text-on-surface outline-none"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={disabled || !pagination.hasPrevPage}
            className="inline-flex items-center gap-1 rounded-xl border border-outline/20 px-3 py-2 text-xs font-bold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span className="text-xs font-bold text-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={disabled || !pagination.hasNextPage}
            className="inline-flex items-center gap-1 rounded-xl border border-outline/20 px-3 py-2 text-xs font-bold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
