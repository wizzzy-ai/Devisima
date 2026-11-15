"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, Edit } from "lucide-react";

export function PaymentsSettings() {
  const [paymentMethods] = useState([
    { id: 1, type: "Visa", last4: "4242", expiry: "12/25", default: true },
  ]);

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground">Payment Methods</h3>
        <p className="mt-1 text-sm text-muted-foreground">Manage your payment methods for purchases</p>

        <div className="mt-4 space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{method.type} •••• {method.last4}</p>
                  <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.default && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Default</span>}
                <button className="p-2 text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></button>
                <button className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}

          <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary">
            <Plus className="h-4 w-4" />
            Add payment method
          </button>
        </div>
      </div>

      {/* Payout Account */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground">Payout Account</h3>
        <p className="mt-1 text-sm text-muted-foreground">Where you receive your seller earnings</p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Bank Name</label>
            <input type="text" placeholder="Enter bank name" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Account Number</label>
            <input type="text" placeholder="Enter account number" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Routing Number</label>
            <input type="text" placeholder="Enter routing number" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>

          <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            Save payout account
          </button>
        </div>
      </div>
    </div>
  );
}
