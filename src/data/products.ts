export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  price: number;
  rating: number;
  reviewCount: number;
  technologies: string[];
  seller: Seller;
  image: string;
  featured: boolean;
  isNew: boolean;
}

export interface Seller {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  productsCount: number;
  rating: number;
  verified: boolean;
}
