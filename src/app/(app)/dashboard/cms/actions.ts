"use server";

import { CmsPublicationStatus, ProjectInquiryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/modules/auth/permissions";
import { requireSession } from "@/modules/auth/session";
import { categorySchema, developmentPackageSchema, faqSchema, productSchema, testimonialSchema } from "@/modules/cms/schemas";
import { deletePublicProductImage, savePublicProductImage } from "@/server/storage/public-assets";

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

async function cmsSession() {
  const session = await requireSession();
  if (!hasPermission(session.user.role, "MANAGE_CMS")) throw new Error("You do not have permission to manage CMS content.");
  return session;
}

function refreshCms() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/software-development");
  revalidatePath("/faqs");
  revalidatePath("/dashboard/cms");
}

export async function createCategoryAction(formData: FormData) {
  const session = await cmsSession();
  const data = categorySchema.parse({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description") || undefined, icon: formData.get("icon") || undefined, status: formData.get("status") });
  await prisma.productCategory.create({ data: { businessId: session.user.businessId, ...data } });
  refreshCms();
}

export async function createProductAction(formData: FormData) {
  const session = await cmsSession();
  const data = productSchema.parse({ categoryId: formData.get("categoryId"), name: formData.get("name"), slug: formData.get("slug"), shortDescription: formData.get("shortDescription"), description: formData.get("description"), price: formData.get("price"), compareAtPrice: formData.get("compareAtPrice") || undefined, imageUrl: formData.get("imageUrl") || undefined, logoUrl: formData.get("logoUrl") || undefined, badge: formData.get("badge") || undefined, features: lines(formData.get("features")), isFeatured: formData.get("isFeatured") === "on", isBestSeller: formData.get("isBestSeller") === "on", sortOrder: formData.get("sortOrder") || 0, status: formData.get("status") });
  const imageFile = formData.get("imageFile");
  const logoFile = formData.get("logoFile");
  const imageUrl = imageFile instanceof File && imageFile.size > 0 ? await savePublicProductImage(imageFile) : data.imageUrl || null;
  const logoUrl = logoFile instanceof File && logoFile.size > 0 ? await savePublicProductImage(logoFile) : data.logoUrl || null;
  await prisma.product.create({ data: { businessId: session.user.businessId, ...data, imageUrl, logoUrl } });
  refreshCms();
}

export async function updateProductAction(formData: FormData) {
  const session = await cmsSession();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.product.findFirstOrThrow({ where: { id, businessId: session.user.businessId } });
  const data = productSchema.parse({ categoryId: formData.get("categoryId"), name: formData.get("name"), slug: formData.get("slug"), shortDescription: formData.get("shortDescription"), description: formData.get("description"), price: formData.get("price"), compareAtPrice: formData.get("compareAtPrice") || undefined, imageUrl: formData.get("imageUrl") || undefined, logoUrl: formData.get("logoUrl") || undefined, badge: formData.get("badge") || undefined, features: lines(formData.get("features")), isFeatured: formData.get("isFeatured") === "on", isBestSeller: formData.get("isBestSeller") === "on", sortOrder: formData.get("sortOrder") || 0, status: formData.get("status") });
  const imageFile = formData.get("imageFile");
  const logoFile = formData.get("logoFile");
  const imageUrl = formData.get("removeImage") === "on" ? null : imageFile instanceof File && imageFile.size > 0 ? await savePublicProductImage(imageFile) : data.imageUrl || null;
  const logoUrl = formData.get("removeLogo") === "on" ? null : logoFile instanceof File && logoFile.size > 0 ? await savePublicProductImage(logoFile) : data.logoUrl || null;
  await prisma.product.update({ where: { id, businessId: session.user.businessId }, data: { ...data, imageUrl, logoUrl } });
  const replacedMedia = new Set([existing.imageUrl !== imageUrl ? existing.imageUrl : null, existing.logoUrl !== logoUrl ? existing.logoUrl : null]);
  await Promise.all(Array.from(replacedMedia, (url) => deletePublicProductImage(url)));
  await prisma.auditLog.create({ data: { businessId: session.user.businessId, actorId: session.user.id, action: "cms_product_updated", entityType: "product", entityId: id, afterState: { name: data.name, status: data.status, isFeatured: data.isFeatured } } });
  refreshCms();
}

export async function deleteProductAction(formData: FormData) {
  const session = await cmsSession();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findFirstOrThrow({ where: { id, businessId: session.user.businessId } });
  await prisma.$transaction([
    prisma.product.delete({ where: { id, businessId: session.user.businessId } }),
    prisma.auditLog.create({ data: { businessId: session.user.businessId, actorId: session.user.id, action: "cms_product_deleted", entityType: "product", entityId: id, beforeState: { name: product.name, slug: product.slug } } }),
  ]);
  await Promise.all(Array.from(new Set([product.imageUrl, product.logoUrl]), (url) => deletePublicProductImage(url)));
  refreshCms();
}

export async function createPackageAction(formData: FormData) {
  const session = await cmsSession();
  const data = developmentPackageSchema.parse({ name: formData.get("name"), slug: formData.get("slug"), serviceType: formData.get("serviceType"), audience: formData.get("audience"), summary: formData.get("summary"), features: lines(formData.get("features")), startingPrice: formData.get("startingPrice") || undefined, timeline: formData.get("timeline"), revisions: formData.get("revisions"), supportPeriod: formData.get("supportPeriod"), isFeatured: formData.get("isFeatured") === "on", status: formData.get("status") });
  await prisma.developmentPackage.create({ data: { businessId: session.user.businessId, ...data } });
  refreshCms();
}

export async function createFaqAction(formData: FormData) {
  const session = await cmsSession();
  const data = faqSchema.parse({ category: formData.get("category"), question: formData.get("question"), answer: formData.get("answer"), keywords: lines(formData.get("keywords")), status: formData.get("status") });
  await prisma.faq.create({ data: { businessId: session.user.businessId, ...data } });
  refreshCms();
}

export async function createTestimonialAction(formData: FormData) {
  const session = await cmsSession();
  const data = testimonialSchema.parse({ customerName: formData.get("customerName"), customerRole: formData.get("customerRole") || undefined, quote: formData.get("quote"), rating: formData.get("rating"), isVerified: formData.get("isVerified") === "on", status: formData.get("status") });
  await prisma.testimonial.create({ data: { businessId: session.user.businessId, ...data } });
  refreshCms();
}

export async function savePageContentAction(formData: FormData) {
  const session = await cmsSession();
  const key = String(formData.get("key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT") as CmsPublicationStatus;
  if (!key || !title || !body) throw new Error("Page key, title, and body are required.");
  await prisma.cmsPage.upsert({ where: { businessId_key: { businessId: session.user.businessId, key } }, update: { title, summary, content: { body }, status }, create: { businessId: session.user.businessId, key, title, summary, content: { body }, status } });
  refreshCms();
}

export async function setCmsStatusAction(formData: FormData) {
  const session = await cmsSession();
  const id = String(formData.get("id") ?? "");
  const entity = String(formData.get("entity") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") as CmsPublicationStatus;
  const where = { id, businessId: session.user.businessId };
  if (entity === "product") await prisma.product.update({ where, data: { status } });
  else if (entity === "category") await prisma.productCategory.update({ where, data: { status } });
  else if (entity === "package") await prisma.developmentPackage.update({ where, data: { status } });
  else if (entity === "faq") await prisma.faq.update({ where, data: { status } });
  else if (entity === "testimonial") await prisma.testimonial.update({ where, data: { status } });
  else throw new Error("Unsupported CMS entity.");
  await prisma.auditLog.create({ data: { businessId: session.user.businessId, actorId: session.user.id, action: "cms_publication_status_changed", entityType: entity, entityId: id, afterState: { status } } });
  refreshCms();
}

export async function updateInquiryStatusAction(formData: FormData) {
  const session = await cmsSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "REVIEWING") as ProjectInquiryStatus;
  await prisma.projectInquiry.update({ where: { id, businessId: session.user.businessId }, data: { status } });
  revalidatePath("/dashboard/cms");
}
