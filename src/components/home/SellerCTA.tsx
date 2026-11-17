import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SellerCTA() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Have software worth selling?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Turn your projects into income by reaching developers, startups, businesses, and creators looking for ready-made solutions.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button className="relative group w-full max-w-xs sm:w-auto">
              <span className="absolute top-1 left-1 h-full w-full rounded bg-white"></span>
              <span className="relative inline-flex h-full w-full items-center justify-center gap-2 rounded border-2 border-white bg-[#0F4C5C] px-6 py-3 text-base font-bold text-white transition-all duration-200 group-hover:bg-[#35D0BA] group-hover:text-[#0F4C5C] sm:w-auto">
                Become a Seller
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <Link
              href="/seller-guide"
              className="inline-flex items-center justify-center px-4 py-3 text-sm font-bold hover:underline"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
