import { PrismaClient } from "@prisma/client";
import { ProductStatus, ProductType, LicenseType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding marketplace data...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "web-applications" },
      update: {},
      create: {
        name: "Web Applications",
        slug: "web-applications",
        description: "Complete web applications and SaaS solutions",
        order: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "mobile-applications" },
      update: {},
      create: {
        name: "Mobile Applications",
        slug: "mobile-applications",
        description: "Flutter, React Native, and native mobile apps",
        order: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "saas" },
      update: {},
      create: {
        name: "SaaS",
        slug: "saas",
        description: "Software as a Service applications and platforms",
        order: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "ecommerce" },
      update: {},
      create: {
        name: "E-commerce",
        slug: "ecommerce",
        description: "Online stores and marketplaces",
        order: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: "business-systems" },
      update: {},
      create: {
        name: "Business Systems",
        slug: "business-systems",
        description: "ERP, CRM, and business management tools",
        order: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: "apis" },
      update: {},
      create: {
        name: "APIs",
        slug: "apis",
        description: "REST APIs, GraphQL APIs, and web services",
        order: 6,
      },
    }),
    prisma.category.upsert({
      where: { slug: "ui-kits" },
      update: {},
      create: {
        name: "UI Kits",
        slug: "ui-kits",
        description: "UI component libraries and design systems",
        order: 7,
      },
    }),
    prisma.category.upsert({
      where: { slug: "templates" },
      update: {},
      create: {
        name: "Templates",
        slug: "templates",
        description: "Website and application templates",
        order: 8,
      },
    }),
    prisma.category.upsert({
      where: { slug: "admin-dashboards" },
      update: {},
      create: {
        name: "Admin Dashboards",
        slug: "admin-dashboards",
        description: "Admin panel and dashboard templates",
        order: 9,
      },
    }),
    prisma.category.upsert({
      where: { slug: "ai-tools" },
      update: {},
      create: {
        name: "AI Tools",
        slug: "ai-tools",
        description: "AI-powered applications and integrations",
        order: 10,
      },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Remove the exact legacy sample products created by this seed file.
  const sampleProductSlugs = [
    "flutter-pos-management-system",
    "nextjs-ecommerce-platform",
    "react-saas-dashboard",
    "school-management-system",
    "hotel-booking-system",
    "ai-content-generator-api",
  ];
  const removedSamples = await prisma.product.deleteMany({
    where: { slug: { in: sampleProductSlugs } },
  });
  console.log(`Removed ${removedSamples.count} seeded sample products`);
  console.log("Marketplace seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
