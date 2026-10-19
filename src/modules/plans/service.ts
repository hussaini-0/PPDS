import { prisma } from "@/lib/prisma";

export async function listActivePlans(businessId: string) {
  return prisma.subscriptionPlan.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ recommendationPriority: "desc" }, { price: "asc" }],
  });
}
