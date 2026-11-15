import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MessageSquare, ArrowUpRight, Sparkles, Star, ShoppingCart } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Reviews - Devisima",
  description: "View your product reviews.",
  robots: "noindex",
};

export default async function ReviewsPage() {
  const user = await requireAuth("/reviews");

  const reviews = await db.review.findMany({
    where: { userId: user.id, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: true,
          seller: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <DashboardShell user={user}>
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> Account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your reviews</h1>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
            Share your experience with products you&apos;ve purchased. Your feedback helps other buyers make informed decisions.
          </p>
          <Link href="/purchases" className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">
            View purchases <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Feedback</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          {reviews.length === 0 ? "No reviews submitted" : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
        </h2>
      </div>

      {reviews.length ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{review.product.title}</h3>
                      <p className="text-sm text-muted-foreground">by {review.product.seller.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="flex h-20 w-20 mx-auto mb-6 items-center justify-center rounded-2xl bg-muted">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No reviews yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Review products you&apos;ve purchased to help other buyers make informed decisions.
          </p>
          <Link
            href="/purchases"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" />
            View Your Purchases
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
