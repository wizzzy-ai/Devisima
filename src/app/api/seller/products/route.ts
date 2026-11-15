import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getSellerApiUser } from "@/lib/products/access";
import { getProductDraftError, productDraftSchema } from "@/lib/products/validation";
import { randomUUID } from "node:crypto";

const nullable = (value: string | undefined) => value?.trim() || null;
const makeSlug = (title: string) => `${title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "product"}-${randomUUID().slice(0, 8)}`;

export async function GET(request: Request) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1));
  const limit = Math.max(1, Math.min(50, Number(params.get("limit")) || 12));
  const search = params.get("search")?.trim().slice(0, 100);
  const status = params.get("status");
  const categoryId = params.get("categoryId");
  const where = {
    sellerId: access.user.id,
    ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { shortDescription: { contains: search, mode: "insensitive" as const } }] } : {}),
    ...(status && ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CHANGES_REQUESTED", "ARCHIVED"].includes(status) ? { status: status as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "CHANGES_REQUESTED" | "ARCHIVED" } : {}),
    ...(categoryId ? { categoryId } : {}),
  };
  const [products, total, counts] = await Promise.all([
    db.product.findMany({ where, include: { category: { select: { name: true } }, assets: { orderBy: { createdAt: "asc" }, select: { id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true, isCover: true, createdAt: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    db.product.count({ where }),
    db.product.groupBy({ by: ["status"], where: { sellerId: access.user.id }, _count: { _all: true }, _sum: { totalSales: true } }),
  ]);
  return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit), counts });
}

export async function POST(request: Request) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const parsed = productDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: getProductDraftError(parsed.error) }, { status: 400 });
  const category = await db.category.findFirst({ where: { id: parsed.data.categoryId, isActive: true }, select: { id: true } });
  if (!category) return NextResponse.json({ message: "Choose an active category." }, { status: 400 });
  const product = await db.product.create({
    data: {
      title: parsed.data.title,
      slug: makeSlug(parsed.data.title),
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      productType: parsed.data.productType,
      licenseType: parsed.data.licenseType,
      categoryId: category.id,
      sellerId: access.user.id,
      technologies: parsed.data.technologies,
      features: parsed.data.features,
      framework: nullable(parsed.data.framework),
      tags: parsed.data.tags,
      requirements: parsed.data.requirements,
      demoUrl: nullable(parsed.data.demoUrl),
      githubUrl: nullable(parsed.data.githubUrl),
      videoUrl: nullable(parsed.data.videoUrl),
      documentationUrl: nullable(parsed.data.documentationUrl),
      version: parsed.data.version,
      changelog: nullable(parsed.data.changelog),
      supportPeriod: nullable(parsed.data.supportPeriod),
      supportInformation: nullable(parsed.data.supportInformation),
      status: "DRAFT",
    },
    select: { id: true, status: true, slug: true },
  });
  return NextResponse.json({ product }, { status: 201 });
}
