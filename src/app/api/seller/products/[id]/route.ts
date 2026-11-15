import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getSellerApiUser } from "@/lib/products/access";
import { getProductDraftError, productDraftSchema } from "@/lib/products/validation";

type Context = { params: Promise<{ id: string }> };
const nullable = (value: string | undefined) => value?.trim() || null;

export async function GET(_request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id } = await params;
  const product = await db.product.findFirst({ where: { id, sellerId: access.user.id }, include: { category: true, assets: { orderBy: { createdAt: "asc" }, select: { id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true, isCover: true, createdAt: true } } } });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id } = await params;
  const parsed = productDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: getProductDraftError(parsed.error) }, { status: 400 });
  const product = await db.product.findFirst({ where: { id, sellerId: access.user.id }, select: { id: true, status: true } });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  if (product.status === "ARCHIVED") return NextResponse.json({ message: "Archived products cannot be edited." }, { status: 409 });
  const category = await db.category.findFirst({ where: { id: parsed.data.categoryId, isActive: true }, select: { id: true } });
  if (!category) return NextResponse.json({ message: "Choose an active category." }, { status: 400 });
  const updated = await db.product.updateMany({
    where: { id, sellerId: access.user.id, status: product.status },
    data: {
      title: parsed.data.title,
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      productType: parsed.data.productType,
      licenseType: parsed.data.licenseType,
      categoryId: category.id,
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
      ...(["PUBLISHED", "PENDING_REVIEW"].includes(product.status) ? { status: "DRAFT" as const, publishedAt: null } : {}),
      moderationNotes: ["CHANGES_REQUESTED", "REJECTED", "PENDING_REVIEW"].includes(product.status) ? null : undefined,
    },
  });
  if (!updated.count) return NextResponse.json({ message: "The product changed while you were editing. Refresh and try again." }, { status: 409 });
  const message = ["PUBLISHED", "PENDING_REVIEW"].includes(product.status)
    ? "Changes saved as a draft. Submit it for review when you're ready to publish."
    : "Draft saved.";
  return NextResponse.json({ message });
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id } = await params;
  const updated = await db.product.updateMany({ where: { id, sellerId: access.user.id, status: { not: "ARCHIVED" } }, data: { status: "ARCHIVED", publishedAt: null } });
  if (!updated.count) return NextResponse.json({ message: "Product not found or already archived." }, { status: 404 });
  return NextResponse.json({ message: "Product archived." });
}
