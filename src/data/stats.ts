export interface MarketplaceStats {
  products: string;
  creators: string;
  customers: string;
  averageRating: string;
}

// Mock marketplace stats - these will eventually come from the database
export const marketplaceStats: MarketplaceStats = {
  products: "2,500+",
  creators: "850+",
  customers: "12,000+",
  averageRating: "4.8/5",
};
