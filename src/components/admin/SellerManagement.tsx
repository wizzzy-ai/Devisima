"use client";

import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clock, ExternalLink, MessageSquare, Package, ShieldAlert, Store, User, X } from "lucide-react";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

type SellerData = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean | null;
  role: string;
  status: string;
  sellerSuspendedAt: Date | null;
  sellerSuspensionReason: string | null;
  sessionVersion: number;
  createdAt: Date;
  storeName: string | undefined;
  applicationStatus: string | undefined;
  applicationId: string | undefined;
  suspended: boolean;
};

type ProductData = {
  id: string;
  title: string;
  slug: string;
  status: string;
  adminRestrictedAt: Date | null;
  adminRestrictionReason: string | null;
  totalSales: number;
  averageRating: number;
  price: number;
  createdAt: Date;
};

type AuditLogData = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
  createdAt: Date;
  admin: {
    name: string | null;
  };
};

export function SellerManagement({
  seller,
  products,
  auditLogs,
}: {
  seller: SellerData;
  products: ProductData[];
  auditLogs: AuditLogData[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "audit">("overview");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSuspend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: seller.suspended ? "REINSTATE" : "SUSPEND",
          confirm: true,
          reason: seller.suspended ? "Reinstating seller access" : "Seller access temporarily restricted for review",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update seller status");
      }

      setShowSuspendModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update seller status:", error);
      alert(error instanceof Error ? error.message : "Failed to update seller status");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MESSAGE",
          confirm: true,
          title: "Message from Devisima Admin",
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      setShowMessageModal(false);
      setMessage("");
      alert("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleRestrictProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to restrict "${productName}"?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESTRICT_PRODUCT",
          confirm: true,
          productId,
          reason: "Product temporarily restricted for review",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to restrict product");
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to restrict product:", error);
      alert(error instanceof Error ? error.message : "Failed to restrict product");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to restore "${productName}"?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESTORE_PRODUCT",
          confirm: true,
          productId,
          reason: "Product restriction removed",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to restore product");
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to restore product:", error);
      alert(error instanceof Error ? error.message : "Failed to restore product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-2">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Marketplace operations</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Seller management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage seller account access, restrict products, and communicate with sellers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMessageModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Send message
          </button>
          <button
            onClick={() => setShowSuspendModal(true)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              seller.suspended
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
          >
            {seller.suspended ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {seller.suspended ? "Reinstate" : "Suspend"}
          </button>
        </div>
      </header>

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">
              {seller.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{seller.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{seller.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  seller.emailVerified
                    ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                }`}>
                  {seller.emailVerified ? "Verified" : "Unverified"}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  seller.suspended
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  {seller.suspended ? "Restricted" : "Active"}
                </span>
                {seller.storeName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    <Store className="h-3 w-3" />
                    {seller.storeName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{seller.role}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{seller.status}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Products</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{products.length}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Joined</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {seller.createdAt.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {seller.sellerSuspensionReason && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Suspension reason</p>
                <p className="mt-1 text-sm text-foreground">{seller.sellerSuspensionReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border">
          <nav className="flex gap-1 px-6" aria-label="Seller management tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "audit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit log ({auditLogs.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Account details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">User ID</p>
                    <p className="mt-1 text-sm font-mono text-foreground">{seller.id}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">Session version</p>
                    <p className="mt-1 text-sm font-mono text-foreground">{seller.sessionVersion}</p>
                  </div>
                </div>
              </section>

              {seller.suspended && (
                <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-destructive">Seller access restricted</h3>
                      <p className="mt-2 text-sm text-foreground">
                        This seller&apos;s marketplace access has been temporarily restricted. Their buyer account remains active for existing purchases.
                        Buyer access to the seller&apos;s published products is retained.
                      </p>
                      {seller.sellerSuspendedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Restricted since {seller.sellerSuspendedAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base font-semibold text-foreground">No products yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This seller hasn&apos;t published any products.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-foreground">{product.title}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>{product.slug}</span>
                              <span>â€¢</span>
                              <span>{formatMarketplaceMoney(product.price)}</span>
                              <span>â€¢</span>
                              <span>{product.totalSales} sales</span>
                              <span>â€¢</span>
                              <span>{product.averageRating.toFixed(1)}â˜…</span>
                            </div>
                          </div>
                        </div>
                        {product.adminRestrictedAt && (
                          <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                            <p className="text-xs font-medium text-destructive">Restricted on {product.adminRestrictedAt.toLocaleDateString("en-NG")}</p>
                            {product.adminRestrictionReason && (
                              <p className="mt-1 text-xs text-foreground">{product.adminRestrictionReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          product.adminRestrictedAt
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : product.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                        }`}>
                          {product.adminRestrictedAt ? "Restricted" : product.status}
                        </span>
                        <a
                          href={`/marketplace/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                        {product.adminRestrictedAt ? (
                          <button
                            onClick={() => handleRestoreProduct(product.id, product.title)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestrictProduct(product.id, product.title)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          >
                            <Ban className="h-3 w-3" />
                            Restrict
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div>
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base font-semibold text-foreground">No audit logs</h3>
                  <p className="mt-1 text-sm text-muted-foreground">No actions have been recorded for this seller yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const metadata = JSON.parse(log.metadata);
                    return (
                      <div
                        key={log.id}
                        className="rounded-xl border border-border bg-muted/30 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{formatAction(log.action)}</span>
                              <span className="text-xs text-muted-foreground">â€¢</span>
                              <span className="text-xs text-muted-foreground">
                                {log.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {log.admin.name ? `by ${log.admin.name}` : ""}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            log.action === "SELLER_SUSPENDED"
                              ? "bg-destructive/10 text-destructive"
                              : log.action === "SELLER_REINSTATED"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-primary/10 text-primary"
                          }`}>
                            {log.action === "SELLER_SUSPENDED" ? "Suspended" : log.action === "SELLER_REINSTATED" ? "Reinstated" : log.action}
                          </span>
                        </div>
                        {metadata.reason && (
                          <p className="mt-3 text-sm text-foreground">
                            <span className="font-medium">Reason: </span>
                            {metadata.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Suspend/Reinstate Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {seller.suspended ? "Reinstate seller access" : "Suspend seller access"}
              </h3>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {seller.suspended
                ? "Are you sure you want to reinstate this seller's marketplace access? They will be able to manage their products and receive payouts again."
                : "Are you sure you want to suspend this seller's marketplace access? Their buyer account will remain active for existing purchases."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={loading}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  seller.suspended ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90"
                }`}
              >
                {loading ? "Processing..." : seller.suspended ? "Reinstate" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Send message to seller</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAction(action: string): string {
  const actions: Record<string, string> = {
    SELLER_SUSPENDED: "Seller Suspended",
    SELLER_REINSTATED: "Seller Reinstated",
    SELLER_PRODUCT_RESTRICTED: "Product Restricted",
    SELLER_PRODUCT_RESTORED: "Product Restored",
    SELLER_MESSAGE_SENT: "Message Sent",
  };
  return actions[action] || action;
}
