"use client";

import { useState, useEffect } from "react";
import { Search, MessageSquare, Star, CheckCircle, XCircle, Eye, Trash2, ShieldCheck, AlertCircle } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    seller: {
      id: string;
      name: string | null;
    };
  };
};

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/reviews?${params}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setMessage({ type: "error", text: "Failed to fetch reviews" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleSearch = () => {
    fetchReviews();
  };

  const handleVerify = async (reviewId: string, isVerified: boolean) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      });

      if (!response.ok) throw new Error("Failed to update review");

      const data = await response.json();
      setReviews(reviews.map((r) => r.id === reviewId ? data.review : r));
      setMessage({ type: "success", text: `Review ${isVerified ? "verified" : "unverified"} successfully` });
    } catch (error) {
      console.error("Failed to update review:", error);
      setMessage({ type: "error", text: "Failed to update review" });
    }
  };

  const handleSoftDelete = async (reviewId: string, isDeleted: boolean) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted }),
      });

      if (!response.ok) throw new Error("Failed to update review");

      const data = await response.json();
      setReviews(reviews.map((r) => r.id === reviewId ? data.review : r));
      setMessage({ type: "success", text: `Review ${isDeleted ? "deleted" : "restored"} successfully` });
    } catch (error) {
      console.error("Failed to update review:", error);
      setMessage({ type: "error", text: "Failed to update review" });
    }
  };

  const handlePermanentDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete review");

      setReviews(reviews.filter((r) => r.id !== reviewId));
      setMessage({ type: "success", text: "Review deleted permanently" });
    } catch (error) {
      console.error("Failed to delete review:", error);
      setMessage({ type: "error", text: "Failed to delete review" });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          message.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{message.text}</p>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="shrink-0 hover:opacity-70"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-64 rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="">All Reviews</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-muted-foreground">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No reviews found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchQuery || statusFilter ? "Try adjusting your filters." : "No reviews have been submitted yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className={`hover:bg-muted/30 transition-colors ${review.isDeleted ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-foreground line-clamp-2">{review.comment}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{review.product.title}</div>
                        <div className="text-xs text-muted-foreground">by {review.product.seller.name || "Unknown"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{review.user.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{review.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {review.isDeleted ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                            <XCircle className="h-3 w-3" />
                            Deleted
                          </span>
                        ) : review.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            <AlertCircle className="h-3 w-3" />
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!review.isDeleted && (
                          <button
                            onClick={() => handleVerify(review.id, !review.isVerified)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title={review.isVerified ? "Unverify" : "Verify"}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSoftDelete(review.id, !review.isDeleted)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title={review.isDeleted ? "Restore" : "Delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {review.isDeleted && (
                          <button
                            onClick={() => handlePermanentDelete(review.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Review Details</h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Rating</h4>
                <div className="flex items-center gap-1">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 text-sm text-muted-foreground">({selectedReview.rating}/5)</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Comment</h4>
                <p className="text-sm text-foreground bg-muted/30 p-4 rounded-xl">{selectedReview.comment}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Customer</h4>
                  <div className="text-sm">
                    <p className="font-medium">{selectedReview.user.name || "Unknown"}</p>
                    <p className="text-muted-foreground">{selectedReview.user.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Product</h4>
                  <div className="text-sm">
                    <p className="font-medium">{selectedReview.product.title}</p>
                    <p className="text-muted-foreground">by {selectedReview.product.seller.name || "Unknown"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Status</h4>
                  {selectedReview.isDeleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                      <XCircle className="h-3 w-3" />
                      Deleted
                    </span>
                  ) : selectedReview.isVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Date</h4>
                  <p className="text-sm text-muted-foreground">{new Date(selectedReview.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
