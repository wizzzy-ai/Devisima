"use client";

import { useState, useEffect } from "react";
import { Search, Star, Sparkles, Plus, X, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  totalSales: number;
  isFeatured: boolean;
  status: string;
  seller: {
    id: string;
    name: string | null;
    email: string;
  };
  category: {
    id: string;
    name: string;
  };
};

type AvailableProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  totalSales: number;
  seller: {
    id: string;
    name: string | null;
  };
  category: {
    id: string;
    name: string;
  };
};

export function AdminFeatured() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/featured?${params}`);
      if (!response.ok) throw new Error("Failed to fetch featured products");

      const data = await response.json();
      setFeaturedProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
      setMessage({ type: "error", text: "Failed to fetch featured products" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
      });

      if (modalSearchQuery) params.append("search", modalSearchQuery);

      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setAvailableProducts(data.products.filter((p: Product) => !p.isFeatured && p.status === "PUBLISHED"));
    } catch (error) {
      console.error("Failed to fetch available products:", error);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, [page, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableProducts();
    }
  }, [showAddModal, modalSearchQuery]);

  const handleAddFeatured = async (productId: string) => {
    try {
      const response = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error("Failed to add featured product");

      const data = await response.json();
      setFeaturedProducts([...featuredProducts, data.product]);
      setAvailableProducts(availableProducts.filter((p) => p.id !== productId));
      setShowAddModal(false);
      setMessage({ type: "success", text: "Product added to featured" });
    } catch (error) {
      console.error("Failed to add featured product:", error);
      setMessage({ type: "error", text: "Failed to add featured product" });
    }
  };

  const handleRemoveFeatured = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this product from featured?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/featured/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove featured product");

      setFeaturedProducts(featuredProducts.filter((p) => p.id !== productId));
      setMessage({ type: "success", text: "Product removed from featured" });
    } catch (error) {
      console.error("Failed to remove featured product:", error);
      setMessage({ type: "error", text: "Failed to remove featured product" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
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
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search featured products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Featured Product
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sales</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-muted-foreground">
                    Loading featured products...
                  </td>
                </tr>
              ) : featuredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No featured products</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchQuery ? "Try adjusting your search." : "Add products to feature them on the homepage."}
                    </p>
                  </td>
                </tr>
              ) : (
                featuredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Star className="h-5 w-5 fill-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{product.title}</div>
                          <div className="text-xs text-muted-foreground">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{product.seller.name || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{formatCurrency(product.price)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-foreground">{product.totalSales}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveFeatured(product.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remove from featured"
                      >
                        <X className="h-4 w-4" />
                      </button>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add Featured Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="rounded-xl border border-border divide-y divide-border max-h-96 overflow-y-auto">
                {availableProducts.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="text-sm text-muted-foreground">
                      {modalSearchQuery ? "No products found matching your search." : "No available products to feature."}
                    </p>
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <div key={product.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{product.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.seller.name || "Unknown"} • {product.category.name} • {formatCurrency(product.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddFeatured(product.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
