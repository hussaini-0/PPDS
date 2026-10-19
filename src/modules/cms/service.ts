import { createHash } from "crypto";

import { CmsPublicationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/server/storage/provider";
import { buildCmsBotReply, rankCmsSearchItems, type CmsSearchItem } from "@/modules/cms/logic";
import { newsletterSchema, projectInquirySchema } from "@/modules/cms/schemas";

export async function getPublicBusiness() {
  return prisma.business.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
}

export async function getStorefrontContent() {
  const business = await getPublicBusiness();
  const [categories, products, packages, testimonials, faqs, pages] = await Promise.all([
    prisma.productCategory.findMany({
      where: { businessId: business.id, status: CmsPublicationStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: { businessId: business.id, status: CmsPublicationStatus.PUBLISHED },
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.developmentPackage.findMany({
      where: { businessId: business.id, status: CmsPublicationStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.testimonial.findMany({
      where: { businessId: business.id, status: CmsPublicationStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.faq.findMany({
      where: { businessId: business.id, status: CmsPublicationStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { category: "asc" }],
    }),
    prisma.cmsPage.findMany({
      where: { businessId: business.id, status: CmsPublicationStatus.PUBLISHED },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { business, categories, products, packages, testimonials, faqs, pages };
}

export async function getPublishedProduct(slug: string) {
  const business = await getPublicBusiness();
  return prisma.product.findFirst({
    where: { businessId: business.id, slug, status: CmsPublicationStatus.PUBLISHED },
    include: { category: true },
  });
}

export async function getFeaturedStorefrontProducts(limit = 5) {
  const business = await getPublicBusiness();
  return prisma.product.findMany({
    where: {
      businessId: business.id,
      status: CmsPublicationStatus.PUBLISHED,
      isFeatured: true,
      category: { slug: { not: "software-services" } },
    },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function createProjectInquiry(formData: FormData) {
  const parsed = projectInquirySchema.parse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName") || undefined,
    email: formData.get("email"),
    whatsappNumber: formData.get("whatsappNumber"),
    serviceRequired: formData.get("serviceRequired"),
    preferredPackage: formData.get("preferredPackage") || undefined,
    projectDescription: formData.get("projectDescription"),
    requiredFeatures: formData.get("requiredFeatures") || undefined,
    expectedBudget: formData.get("expectedBudget") || undefined,
    desiredDeadline: formData.get("desiredDeadline") || undefined,
    referenceWebsite: formData.get("referenceWebsite") || undefined,
    preferredContactMethod: formData.get("preferredContactMethod"),
    consent: String(formData.get("consent")),
  });
  const business = await getPublicBusiness();
  const file = formData.get("briefFile");
  let briefFileId: string | undefined;

  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) throw new Error("Brief file must be 10 MB or smaller.");
    const allowed = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) throw new Error("Brief file must be PDF, DOCX, JPG, or PNG.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await getStorageProvider().save({ buffer, originalName: file.name });
    const uploaded = await prisma.uploadedFile.create({
      data: {
        businessId: business.id,
        storageProvider: stored.storageProvider,
        storageKey: stored.storageKey,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        checksum: createHash("sha256").update(buffer).digest("hex"),
      },
    });
    briefFileId = uploaded.id;
  }

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.projectInquiry.create({
      data: {
        businessId: business.id,
        ...parsed,
        consent: true,
        desiredDeadline: parsed.desiredDeadline ? new Date(parsed.desiredDeadline) : null,
        referenceWebsite: parsed.referenceWebsite || null,
        briefFileId,
      },
    });
    await tx.ownerAttentionItem.create({
      data: {
        businessId: business.id,
        priority: "HIGH",
        reason: `New ${parsed.serviceRequired} enquiry from ${parsed.fullName}`,
        recommendedAction: `Review project enquiry ${inquiry.id} and contact the lead by ${parsed.preferredContactMethod.toLowerCase()}.`,
      },
    });
    await tx.auditLog.create({
      data: {
        businessId: business.id,
        action: "public_project_inquiry_created",
        entityType: "ProjectInquiry",
        entityId: inquiry.id,
        afterState: { serviceRequired: parsed.serviceRequired, preferredPackage: parsed.preferredPackage } as Prisma.InputJsonValue,
      },
    });
    return inquiry;
  });
}

export async function subscribeToNewsletter(input: unknown) {
  const parsed = newsletterSchema.parse(input);
  const business = await getPublicBusiness();
  return prisma.newsletterSubscriber.upsert({
    where: { businessId_email: { businessId: business.id, email: parsed.email.toLowerCase() } },
    update: { isActive: true, consentedAt: new Date() },
    create: { businessId: business.id, email: parsed.email.toLowerCase() },
  });
}

export async function findPublishedCmsBotAnswer(businessId: string, query: string) {
  if (query.trim().length < 3) return null;
  const [business, products, packages, faqs] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.product.findMany({
      where: { businessId, status: CmsPublicationStatus.PUBLISHED },
      include: { category: true },
    }),
    prisma.developmentPackage.findMany({
      where: { businessId, status: CmsPublicationStatus.PUBLISHED },
    }),
    prisma.faq.findMany({
      where: { businessId, status: CmsPublicationStatus.PUBLISHED },
    }),
  ]);
  const items: CmsSearchItem[] = [
    ...products.map((product) => ({
      id: product.id,
      kind: "product" as const,
      title: product.name,
      body: product.shortDescription,
      keywords: [product.category.name, ...product.features],
      price: Number(product.price),
    })),
    ...packages.map((item) => ({
      id: item.id,
      kind: "package" as const,
      title: item.name,
      body: item.summary,
      keywords: [item.serviceType, item.audience, ...item.features],
      price: item.startingPrice ? Number(item.startingPrice) : null,
      timeline: item.timeline,
    })),
    ...faqs.map((faq) => ({
      id: faq.id,
      kind: "faq" as const,
      title: faq.question,
      body: faq.answer,
      keywords: [faq.category, ...faq.keywords],
    })),
  ];
  const top = rankCmsSearchItems(query, items)[0];
  return top && top.score >= 1 ? buildCmsBotReply(top.item, business.currency) : null;
}
