import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { MarketplaceStats } from "@/components/home/MarketplaceStats";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { PopularSolutions } from "@/components/home/PopularSolutions";
import { NewProducts } from "@/components/home/NewProducts";
import { TopSellers } from "@/components/home/TopSellers";
import { WhyDevisima } from "@/components/home/WhyDevisima";
import { SellerCTA } from "@/components/home/SellerCTA";
import { FinalCTA } from "@/components/home/FinalCTA";
import { ScrollReveal } from "@/components/home/ScrollReveal";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ScrollReveal><MarketplaceStats /></ScrollReveal>
        <ScrollReveal><FeaturedProducts /></ScrollReveal>
        <ScrollReveal><CategoriesSection /></ScrollReveal>
        <ScrollReveal><PopularSolutions /></ScrollReveal>
        <ScrollReveal><NewProducts /></ScrollReveal>
        <ScrollReveal><TopSellers /></ScrollReveal>
        <ScrollReveal><WhyDevisima /></ScrollReveal>
        <ScrollReveal><SellerCTA /></ScrollReveal>
        <ScrollReveal><FinalCTA /></ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}
