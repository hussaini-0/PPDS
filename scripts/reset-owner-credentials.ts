import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../src/lib/prisma";

const inputSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(14)
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol."),
});

async function main() {
  const input = inputSchema.parse({
    email: process.env.RESET_OWNER_EMAIL,
    password: process.env.RESET_OWNER_PASSWORD,
  });

  const owners = await prisma.user.findMany({
    where: { role: "OWNER" },
    select: { id: true, businessId: true, email: true },
    take: 2,
  });

  if (owners.length !== 1) {
    throw new Error(`Credential reset refused: expected exactly one owner, found ${owners.length}.`);
  }

  const owner = owners[0];
  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (transaction) => {
    await transaction.session.deleteMany({ where: { userId: owner.id } });
    await transaction.user.update({
      where: { id: owner.id },
      data: {
        email: input.email,
        passwordHash,
        isActive: true,
      },
    });
    await transaction.auditLog.create({
      data: {
        businessId: owner.businessId,
        actorId: owner.id,
        action: "owner_credentials_rotated",
        entityType: "User",
        entityId: owner.id,
        beforeState: { email: owner.email },
        afterState: { email: input.email },
      },
    });
  });

  console.log(`Owner credentials reset for ${input.email}. Existing admin sessions were revoked.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
