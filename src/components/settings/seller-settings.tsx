"use client";

import { useState } from "react";
import { Store, Package, FileText, Upload } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

export function SellerSettings() {
  const [autoApproveProducts, setAutoApproveProducts] = useState(false);
  const [allowProductReviews, setAllowProductReviews] = useState(true);

  return (
    <div className="space-y-6">
      {/* Store Settings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Store Settings</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Customize your seller store appearance</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Store Name</label>
            <input type="text" placeholder="Your store name" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Store Description</label>
            <textarea placeholder="Describe your store" rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Store Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <button className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                Upload logo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Settings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Products</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Manage your product settings and defaults</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div>
              <p className="font-medium text-foreground">Auto-approve products</p>
              <p className="text-xs text-muted-foreground">Products go live immediately after upload</p>
            </div>
            <SquishSwitch checked={autoApproveProducts} onChange={setAutoApproveProducts} ariaLabel="Auto-approve products" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div>
              <p className="font-medium text-foreground">Allow product reviews</p>
              <p className="text-xs text-muted-foreground">Buyers can review your products</p>
            </div>
            <SquishSwitch checked={allowProductReviews} onChange={setAllowProductReviews} ariaLabel="Allow product reviews" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
          </div>
        </div>
      </div>

      {/* Licenses Settings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Licenses</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Configure license types for your products</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Default License Type</label>
            <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10">
              <option>Standard License</option>
              <option>Extended License</option>
              <option>Commercial License</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">License Terms</label>
            <textarea placeholder="Enter your license terms" rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

