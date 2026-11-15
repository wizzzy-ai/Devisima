import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileArchive } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SecureDownloadButton } from "@/components/purchases/SecureDownloadButton";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Downloads | Devisima", description: "Your secure product download history.", robots: "noindex" };

export default async function DownloadsPage() {
  const user = await requireAuth("/downloads");
  const downloads = await db.download.findMany({
    where: { userId: user.id, purchase: { userId: user.id, order: { status: "PAID", payments: { some: { status: "SUCCESS" } } } } },
    orderBy: { downloadedAt: "desc" },
    take: 100,
      select: { id: true, downloadedAt: true, purchaseId: true, file: { select: { id: true, fileName: true } }, product: { select: { title: true } } },
  });

  return (
    <DashboardShell user={user}>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Account</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Downloads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Files downloaded from your verified purchases.</p>
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Download className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No downloads yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your secure download history will appear here.</p>
          <Link href="/purchases" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            View Purchases
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card px-5 shadow-sm">
          {downloads.map((entry) => (
            <article key={entry.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <FileArchive className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{entry.file?.fileName ?? "File no longer available"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.product.title} · {entry.downloadedAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })}
                </p>
              </div>
              {entry.file && <SecureDownloadButton href={`/api/downloads/${entry.purchaseId}?fileId=${encodeURIComponent(entry.file.id)}`} fileName={entry.file.fileName} compact />}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
