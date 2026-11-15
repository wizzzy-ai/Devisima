import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your next project could start here.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore thousands of digital products built to help you launch faster.
          </p>
          <button className="relative group">
            <span className="absolute top-1 left-1 h-full w-full rounded bg-[#0F4C5C]"></span>
            <span className="relative inline-flex items-center gap-2 h-full w-full rounded border-2 border-[#0F4C5C] bg-white px-6 py-3 text-base font-bold text-[#0F4C5C] transition-all duration-200 group-hover:bg-[#35D0BA] group-hover:text-[#0F4C5C]">
              Explore Marketplace
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
