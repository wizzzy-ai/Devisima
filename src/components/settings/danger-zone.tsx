"use client";

import { useState } from "react";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";

export function DangerZone() {
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);

  async function confirmDelete() {
    setPendingDelete(true);
    setDeleteMessage("");
    try {
      const response = await fetch("/api/privacy/delete", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "The deletion request could not be processed.");
      setDeleteMessage(payload.message ?? "Your deletion request has been recorded.");
      setDeleteModal(false);
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "The deletion request could not be processed.");
    } finally {
      setPendingDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Deactivate Account */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Deactivate Account</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Temporarily disable your account. You can reactivate it later by signing in.
        </p>

        <button
          onClick={() => setDeactivateModal(true)}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Deactivate account
        </button>

        {deactivateModal && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-foreground mb-4">
              Are you sure you want to deactivate your account? You can reactivate it anytime by signing in.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeactivateModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                Yes, deactivate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-foreground">Delete Account</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <button
          onClick={() => setDeleteModal(true)}
          className="rounded-xl border border-destructive bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/20"
        >
          Delete account
        </button>

        {deleteModal && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-background p-4">
            <p className="text-sm text-foreground mb-4">
              Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
            </p>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Type 'DELETE' to confirm"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                disabled={pendingDelete}
                onClick={confirmDelete}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingDelete ? "Processing..." : "Yes, delete permanently"}
              </button>
            </div>
            {deleteMessage && <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">{deleteMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
