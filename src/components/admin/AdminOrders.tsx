"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Package, CreditCard, CheckCircle, XCircle, Clock, AlertCircle, Eye } from "lucide-react";

type Order = {
  id: string;
  reference: string;
  status: "PENDING" | "PAYMENT_PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: Array<{
    id: string;
    price: number;
    product: {
      id: string;
      title: string;
      slug: string;
      seller: {
        id: string;
        name: string | null;
        email: string;
      };
    };
  }>;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
  }>;
  _count: {
    items: number;
    refunds: number;
  };
};

type OrderDetail = Order & {
  items: Array<{
    id: string;
    price: number;
    product: {
      id: string;
      title: string;
      slug: string;
      price: number;
      seller: {
        id: string;
        name: string | null;
        email: string;
      };
    };
  }>;
  refunds: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
  purchases: Array<{
    id: string;
    product: {
      id: string;
      title: string;
    };
  }>;
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setMessage({ type: "error", text: "Failed to fetch orders" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order details");

      const data = await response.json();
      setSelectedOrder(data.order);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      setMessage({ type: "error", text: "Failed to fetch order details" });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleSearch = () => {
    fetchOrders();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case "REFUNDED":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "PAYMENT_PROCESSING":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
      case "FAILED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "CANCELLED":
        return "bg-muted text-muted-foreground border-border";
      case "REFUNDED":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "PAYMENT_PROCESSING":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
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
              placeholder="Search orders..."
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
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAYMENT_PROCESSING">Payment Processing</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-muted-foreground">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No orders found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchQuery || statusFilter ? "Try adjusting your filters." : "No orders have been placed yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{order.reference}</div>
                        <div className="text-xs text-muted-foreground">{order._count.items} item(s)</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{order.user.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{order.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {order.items.slice(0, 2).map((item) => item.product.title).join(", ")}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{formatCurrency(order.total, order.currency)}</div>
                      {order.discount > 0 && (
                        <div className="text-xs text-muted-foreground">-{formatCurrency(order.discount, order.currency)} discount</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => fetchOrderDetail(order.id)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Order Details</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.reference}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Customer</h4>
                  <div className="text-sm">
                    <p className="font-medium">{selectedOrder.user.name || "Unknown"}</p>
                    <p className="text-muted-foreground">{selectedOrder.user.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Order Status</h4>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Order Items</h4>
                <div className="rounded-xl border border-border divide-y divide-border">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.product.title}</p>
                        <p className="text-xs text-muted-foreground">Seller: {item.product.seller?.name || item.product.seller?.email || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(item.price || 0, selectedOrder.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(selectedOrder.discount, selectedOrder.currency)}</p>
                </div>
                <div className="rounded-xl border border-border bg-primary/10 p-4">
                  <p className="text-xs text-primary-foreground/70">Total</p>
                  <p className="text-lg font-semibold text-primary">{formatCurrency(selectedOrder.total, selectedOrder.currency)}</p>
                </div>
              </div>

              {selectedOrder.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Payment History</h4>
                  <div className="rounded-xl border border-border divide-y divide-border">
                    {selectedOrder.payments.map((payment) => (
                      <div key={payment.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{payment.status}</p>
                          <p className="text-xs text-muted-foreground">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="font-medium text-foreground">{formatCurrency(payment.amount, selectedOrder.currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.refunds.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Refunds</h4>
                  <div className="rounded-xl border border-border divide-y divide-border">
                    {selectedOrder.refunds.map((refund) => (
                      <div key={refund.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{refund.status}</p>
                        </div>
                        <p className="font-medium text-foreground">{formatCurrency(refund.amount, selectedOrder.currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
