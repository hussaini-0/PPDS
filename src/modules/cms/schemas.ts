import { z } from "zod";

export const projectInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().max(160).optional(),
  email: z.email(),
  whatsappNumber: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Use a valid international phone number."),
  serviceRequired: z.string().trim().min(2).max(120),
  preferredPackage: z.string().trim().max(120).optional(),
  projectDescription: z.string().trim().min(30).max(5000),
  requiredFeatures: z.string().trim().max(3000).optional(),
  expectedBudget: z.string().trim().max(120).optional(),
  desiredDeadline: z.string().trim().optional(),
  referenceWebsite: z.union([z.url(), z.literal("")]).optional(),
  preferredContactMethod: z.enum(["WHATSAPP", "EMAIL", "PHONE"]),
  consent: z.literal("true"),
});

export const newsletterSchema = z.object({
  email: z.email(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(40).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const productSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(5000),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  imageUrl: z.union([z.url(), z.string().regex(/^\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|svg)$/), z.literal("")]).optional(),
  logoUrl: z.union([z.url(), z.string().regex(/^\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|svg)$/), z.literal("")]).optional(),
  badge: z.string().trim().max(40).optional(),
  features: z.array(z.string().trim().min(1)).min(1),
  isFeatured: z.coerce.boolean(),
  isBestSeller: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const developmentPackageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  serviceType: z.string().trim().min(2).max(120),
  audience: z.string().trim().min(10).max(300),
  summary: z.string().trim().min(10).max(600),
  features: z.array(z.string().trim().min(1)).min(1),
  startingPrice: z.coerce.number().positive().optional(),
  timeline: z.string().trim().min(2).max(120),
  revisions: z.string().trim().min(2).max(120),
  supportPeriod: z.string().trim().min(2).max(120),
  isFeatured: z.coerce.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const faqSchema = z.object({
  category: z.string().trim().min(2).max(80),
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(10).max(3000),
  keywords: z.array(z.string().trim().min(1)),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerRole: z.string().trim().max(160).optional(),
  quote: z.string().trim().min(10).max(1000),
  rating: z.coerce.number().int().min(1).max(5),
  isVerified: z.coerce.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});
