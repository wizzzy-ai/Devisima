import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { ProductStatus, ProductType, LicenseType } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const DATABASE_READY = /^(?:postgres(?:ql)?|prisma(?:\+postgres)?):\/\//i.test(DATABASE_URL);

async function withDatabaseFallback<T>(fallback: T, operation: () => Promise<T>): Promise<T> {
  if (!DATABASE_READY) return fallback;

  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P6001" || error.message.includes("the URL must start with the protocol"))) {
      return fallback;
    }
    throw error;
  }
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  technologies?: string[];
  sort?: "featured" | "popular" | "newest" | "rating" | "price-asc" | "price-desc";
  page?: number;
  limit?: number;
}

export interface MarketplaceResult {
  products: Array<{
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    images: string[];
    demoUrl: string | null;
    price: number;
    compareAtPrice: number | null;
    productType: ProductType;
    licenseType: LicenseType;
    technologies: string[];
    features: string[];
    version: string;
    averageRating: number;
    reviewCount: number;
    totalSales: number;
    isFeatured: boolean;
    likeCount: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    seller: {
      id: string;
      name: string;
      image: string | null;
    };
    publishedAt: Date | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMarketplaceProducts(filters: MarketplaceFilters = {}): Promise<MarketplaceResult> {
  if (!DATABASE_READY) {
    return {
      products: [],
      total: 0,
      page: filters.page ?? 1,
      limit: filters.limit ?? 24,
      totalPages: 0,
    };
  }

  const {
    search,
    category,
    productType,
    minPrice,
    maxPrice,
    minRating,
    technologies,
    sort = "newest",
    page = 1,
    limit = 24,
  } = filters;

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.PUBLISHED,
    adminRestrictedAt: null,
    seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
  };

  // Search across multiple fields
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { technologies: { hasSome: [search] } },
    ];
  }

  // Category filter
  if (category) {
    where.category = {
      slug: category,
    };
  }

  // Product type filter
  if (productType) {
    where.productType = productType;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Rating filter
  if (minRating !== undefined) {
    where.averageRating = { gte: minRating };
  }

  // Technology filter
  if (technologies && technologies.length > 0) {
    where.technologies = { hasSome: technologies };
  }

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
  switch (sort) {
    case "featured":
      orderBy = [{ isFeatured: "desc" }, { totalSales: "desc" }];
      break;
    case "popular":
      orderBy = [{ totalSales: "desc" }, { totalViews: "desc" }];
      break;
    case "newest":
      orderBy = { publishedAt: "desc" };
      break;
    case "rating":
      orderBy = [{ averageRating: "desc" }, { reviewCount: "desc" }];
      break;
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    default:
      orderBy = { publishedAt: "desc" };
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        images: true,
        demoUrl: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        licenseType: true,
        technologies: true,
        features: true,
        version: true,
        averageRating: true,
        reviewCount: true,
        totalSales: true,
        isFeatured: true,
        likeCount: true,
        publishedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFeaturedProducts(limit = 6) {
  return withDatabaseFallback([], () =>
    db.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
        isFeatured: true,
      },
      take: limit,
      orderBy: [
        { isFeatured: "desc" },
        { totalSales: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        images: true,
        demoUrl: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        licenseType: true,
        technologies: true,
        features: true,
        version: true,
        averageRating: true,
        reviewCount: true,
        totalSales: true,
        isFeatured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })
  );
}

const SOMPAY_POPULAR_FALLBACK = [
  {
    id: "sompay-solution-id",
    title: "SOMPAY",
    slug: "sompay",
    shortDescription:
      "SomPay is a modern digital payment platform, focused on simplifying transactions through a beautiful, user-friendly interface.",
    images: ["/products/sompay-preview.svg"],
    demoUrl: "https://sompay.vercel.app",
    price: 55000,
    compareAtPrice: 60000,
    productType: ProductType.COMPLETE_APPLICATION,
    licenseType: LicenseType.COMMERCIAL,
    technologies: ["JavaScript", "HTML5"],
    features: [
      "Modern and responsive user interface",
      "Intuitive payment dashboard",
    ],
    version: "1.0.0",
    averageRating: 0,
    reviewCount: 0,
    totalSales: 0,
    isFeatured: false,
    likeCount: 0,
    category: {
      id: "business-systems",
      name: "Business Systems",
      slug: "business-systems",
    },
    seller: {
      id: "chisom-work",
      name: "chisom work",
      image: null,
    },
  },
];

export async function getPopularSolutions(limit = 6) {
  return withDatabaseFallback(SOMPAY_POPULAR_FALLBACK, async () => {
    const products = await db.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
        productType: { in: [ProductType.BUSINESS_SYSTEM, ProductType.COMPLETE_APPLICATION] },
      },
      take: limit,
      orderBy: [{ totalSales: "desc" }, { totalViews: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        images: true,
        demoUrl: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        licenseType: true,
        technologies: true,
        features: true,
        version: true,
        averageRating: true,
        reviewCount: true,
        totalSales: true,
        isFeatured: true,
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });

    return products.length > 0 ? products : SOMPAY_POPULAR_FALLBACK;
  });
}

export async function getCategories() {
  return withDatabaseFallback([], () =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
    })
  );
}

export async function getProductBySlug(slug: string) {
  return withDatabaseFallback(null, () =>
    db.product.findUnique({
      where: { slug, status: "PUBLISHED", adminRestrictedAt: null, seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null } },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reviews: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })
  );
}

export async function getNewProducts(limit = 8) {
  return withDatabaseFallback([], () =>
    db.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        images: true,
        demoUrl: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        licenseType: true,
        technologies: true,
        features: true,
        version: true,
        averageRating: true,
        reviewCount: true,
        totalSales: true,
        isFeatured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })
  );
}
