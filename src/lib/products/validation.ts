import { LicenseType, ProductType } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const optionalHttpUrl = z.union([
  z.literal(""),
  z.string().trim().url().max(2048).refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL."),
]).optional().default("");
const textList = (maxItems: number, maxLength: number) => z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).optional().default([]);

export const productDraftSchema = z.object({
  title: z.string().trim().min(3, "Enter a product name (at least 3 characters).").max(100),
  shortDescription: z.string().trim().min(10, "Add a short description.").max(300),
  description: z.string().trim().min(20, "Add a full product description.").max(12000),
  categoryId: z.string().cuid(),
  productType: z.nativeEnum(ProductType),
  price: z.number().int().min(0).max(100_000_000),
  compareAtPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  licenseType: z.nativeEnum(LicenseType),
  framework: optionalText(80),
  technologies: textList(20, 1000),
  features: textList(30, 1000),
  tags: textList(20, 1000),
  requirements: textList(30, 1000),
  demoUrl: optionalHttpUrl,
  githubUrl: optionalHttpUrl,
  videoUrl: optionalHttpUrl,
  documentationUrl: optionalHttpUrl,
  version: z.string().trim().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/, "Use semantic versioning, for example 1.0.0."),
  changelog: optionalText(5000),
  supportPeriod: optionalText(80),
  supportInformation: optionalText(3000),
});

export type ProductDraftInput = z.infer<typeof productDraftSchema>;

export function getProductDraftError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Check the product details.";
  const field = issue.path[0];
  const fieldLabels: Record<string, string> = {
    title: "Product name",
    shortDescription: "Short description",
    description: "Full description",
    categoryId: "Category",
    technologies: "Technologies",
    features: "Features",
    tags: "Tags",
    requirements: "Requirements",
    demoUrl: "Demo/live URL",
    githubUrl: "GitHub URL",
    videoUrl: "Video URL",
    documentationUrl: "Documentation URL",
    version: "Version",
  };
  const label = typeof field === "string" ? fieldLabels[field] : undefined;
  return label ? `${label}: ${issue.message}` : issue.message;
}

export function validateProductForReview(product: {
  title: string;
  demoUrl?: string | null;
  shortDescription: string;
  description: string;
  categoryId: string;
  price: number;
  version: string;
}, hasCover: boolean, privateFileCount: number) {
  if (product.title.trim().length < 3) return "Add a product name before submitting.";
  if (product.shortDescription.trim().length < 10) return "Add a short description before submitting.";
  if (product.description.trim().length < 80) return "The full description must be at least 80 characters.";
  if (!product.categoryId) return "Choose a category before submitting.";
  if (product.price < 1) return "Set a price greater than zero before submitting.";
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(product.version)) return "Enter a valid semantic version.";
  if (!hasCover && !product.demoUrl) return "Add a demo URL or upload a cover image before submitting.";
  if (privateFileCount < 1) return "Upload at least one private product ZIP before submitting.";
  return null;
}
