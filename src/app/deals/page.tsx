import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DealsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Deals
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find the best deals on digital products. This page will be implemented in a future phase.
          </p>

          <div className="bg-muted/30 rounded-lg p-8 border border-border/50">
            <p className="text-muted-foreground">
              Coming soon! We&apos;re building a deals section with discounts, bundles, and limited-time offers.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
