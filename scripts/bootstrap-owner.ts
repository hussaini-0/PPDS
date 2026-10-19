import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../src/lib/prisma";

const bootstrapSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(14)
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol."),
  ownerName: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(160),
  businessId: z.string().trim().optional(),
});

async function main() {
  const input = bootstrapSchema.parse({
    email: process.env.BOOTSTRAP_OWNER_EMAIL,
    password: process.env.BOOTSTRAP_OWNER_PASSWORD,
    ownerName: process.env.BOOTSTRAP_OWNER_NAME ?? "Owner",
    businessName: process.env.BOOTSTRAP_BUSINESS_NAME ?? "Prime Plus Digital Services",
    businessId: process.env.BOOTSTRAP_BUSINESS_ID || undefined,
  });

  const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
  if (ownerCount > 0) {
    throw new Error("Bootstrap refused: an owner account already exists.");
  }

  const businesses = await prisma.business.findMany({
    select: { id: true },
    take: 2,
  });
  if (!input.businessId && businesses.length > 1) {
    throw new Error("BOOTSTRAP_BUSINESS_ID is required when multiple businesses exist.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await prisma.$transaction(async (transaction) => {
    const businessId = input.businessId ?? businesses[0]?.id;
    const business = businessId
      ? await transaction.business.findUniqueOrThrow({ where: { id: businessId } })
      : await transaction.business.create({
          data: {
            name: input.businessName,
            timezone: process.env.BUSINESS_TIMEZONE ?? "Asia/Karachi",
            currency: process.env.DEFAULT_CURRENCY ?? "PKR",
            defaultLanguage: "en",
          },
        });
    const owner = await transaction.user.create({
      data: {
        businessId: business.id,
        name: input.ownerName,
        email: input.email,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
    });
    await transaction.auditLog.create({
      data: {
        businessId: business.id,
        actorId: owner.id,
        action: "production_owner_bootstrapped",
        entityType: "User",
        entityId: owner.id,
        afterState: { email: owner.email, role: owner.role },
      },
    });
    return { businessId: business.id, ownerId: owner.id, email: owner.email };
  });

  console.log(`Production owner created for ${result.email}.`);
  console.log(`Business ID: ${result.businessId}`);
  console.log(`Owner ID: ${result.ownerId}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
