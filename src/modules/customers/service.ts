import { prisma } from "@/lib/prisma";

export async function listCustomers(businessId: string) {
  return prisma.customer.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}
