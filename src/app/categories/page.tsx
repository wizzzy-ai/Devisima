import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Categories
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Browse products by category. This page will be implemented in a future phase.
          </p>

          <div className="bg-muted/30 rounded-lg p-8 border border-border/50">
            <p className="text-muted-foreground">
              Coming soon! We&apos;re building out the categories page to help you discover products more easily.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
