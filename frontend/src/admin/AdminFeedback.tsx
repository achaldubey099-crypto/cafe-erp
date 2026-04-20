import { useEffect, useState } from "react";
import { MessageSquareText, Star } from "lucide-react";

import API from "../lib/api";
import PaginationControls from "../components/PaginationControls";
import { createPaginationState } from "../lib/pagination";
import { PaginationMeta } from "../types";

type FeedbackRecord = {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  order: {
    _id: string;
    tableId?: number;
    orderNumber?: number | null;
    grandTotal: number;
    status: string;
    createdAt: string;
  } | null;
};

type FeedbackResponse = {
  feedback: FeedbackRecord[];
  pagination: PaginationMeta;
};

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(createPaginationState(10));

  const loadFeedback = async (pageNumber = page, limitNumber = pagination.limit) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get<FeedbackResponse>("/admin/feedback", {
        params: {
          page: pageNumber,
          limit: limitNumber,
        },
      });

      setFeedback(res.data.feedback || []);
      setPagination(res.data.pagination || createPaginationState(limitNumber));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load feedback");
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedback();
  }, [page, pagination.limit]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Customer Feedback</h2>
        <p className="text-secondary font-medium mt-1">Recent ratings and comments left by signed-in customers.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>}

      <section className="bg-white rounded-3xl border border-outline/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquareText size={22} />
          </div>
          <div>
            <p className="text-sm font-headline font-bold text-on-surface">Feedback Inbox</p>
            <p className="text-xs text-secondary">Use this tab to review experience issues and compliments.</p>
          </div>
        </div>

        <div className="divide-y divide-outline/10">
          {!loading && feedback.length === 0 && (
            <div className="p-6 text-sm text-secondary">No feedback has been submitted yet.</div>
          )}

          {feedback.map((item) => (
            <div key={item._id} className="p-6 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-headline font-bold text-on-surface">{item.user?.name || "Customer"}</p>
                  <p className="text-xs text-secondary">{item.user?.email || "No email available"}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    <Star size={14} className="fill-current" />
                    {item.rating}/5
                  </div>
                  <p className="mt-2 text-xs text-secondary">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface">
                {item.comment?.trim() ? item.comment : "No written comment was provided."}
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-secondary">
                <span>Order #{item.order?.orderNumber || item.order?._id?.slice(-6)?.toUpperCase() || "N/A"}</span>
                <span>Table {item.order?.tableId ?? "N/A"}</span>
                <span>Status: {item.order?.status || "Unknown"}</span>
                <span>Total: Rs {Number(item.order?.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <PaginationControls
          pagination={pagination}
          itemLabel="feedback entries"
          disabled={loading}
          onPageChange={setPage}
          onLimitChange={(limit) => {
            setPagination((current) => ({ ...current, limit }));
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
