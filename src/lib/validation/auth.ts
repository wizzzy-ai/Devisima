import { z } from "zod";

export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128).regex(/[A-Z]/, "Add an uppercase letter.").regex(/[a-z]/, "Add a lowercase letter.").regex(/[0-9]/, "Add a number.");
const email = z.string().trim().email("Enter a valid email address.").max(254).transform((value) => value.toLowerCase());

export const registerSchema = z.object({ name: z.string().trim().min(2, "Enter your full name.").max(80), email, password: passwordSchema, confirmPassword: z.string(), acceptTerms: z.boolean().refine((accepted) => accepted, "Accept the Terms & Conditions to create an account.") }).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export const loginSchema = z.object({ email, password: z.string().min(1).max(128), rememberMe: z.boolean().optional() });
export const forgotPasswordSchema = z.object({ email });
export const verifyOtpSchema = z.object({ email, otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email.") });
export const resetPasswordSchema = z.object({ token: z.string().min(32).max(256), password: passwordSchema, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80) });
export const sellerApplicationSchema = z.object({
  storeName: z.string().trim().min(2, "Enter a store name.").max(80),
  description: z.string().trim().min(40, "Describe your store in at least 40 characters.").max(2000),
  productTypes: z.array(z.string().trim().min(1)).min(1, "Select at least one product type.").max(10, "Select up to 10 product types."),
  technologies: z.array(z.string().trim().min(1)).min(1, "Select at least one technology.").max(20, "Select up to 20 technologies."),
  portfolioUrl: z.union([z.literal(""), z.string().url("Enter a valid portfolio URL.").max(2048).refine((value) => /^https?:\/\//i.test(value), "Use an HTTPS or HTTP URL.")]).transform((value) => value || null),
  githubUrl: z.union([z.literal(""), z.string().url("Enter a valid GitHub URL.").max(2048).refine((value) => /^https?:\/\//i.test(value), "Use an HTTPS or HTTP URL.")]).transform((value) => value || null),
  whyJoin: z.union([z.string().trim().max(1500), z.null()]).optional().transform((value) => value || null),
});
export const sellerApplicationSubmissionSchema = sellerApplicationSchema.extend({
  applicationId: z.string().cuid().optional(),
  confirmResubmission: z.boolean().optional(),
}).refine((data) => !data.applicationId || data.confirmResubmission === true, {
  path: ["confirmResubmission"],
  message: "Confirm that you want to resubmit this application.",
});
export const sellerApplicationReviewSchema = z.object({
  applicationId: z.string().cuid(),
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  rejectionReason: z.string().trim().max(1500).optional(),
  adminNotes: z.string().trim().max(1000).optional().default(""),
  confirmRejection: z.boolean().optional(),
}).refine((data) => data.decision === "APPROVE" || Boolean(data.rejectionReason && data.rejectionReason.length >= 10), {
  path: ["rejectionReason"],
  message: "Provide applicant-facing feedback of at least 10 characters.",
}).refine((data) => data.decision !== "REJECT" || data.confirmRejection === true, {
  path: ["confirmRejection"],
  message: "Confirm this decision before submitting it.",
}).refine((data) => data.decision !== "REQUEST_CHANGES" || data.confirmRejection === true, {
  path: ["confirmRejection"],
  message: "Confirm this decision before submitting it.",
});
