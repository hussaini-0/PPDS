import { prisma } from "@/lib/prisma";
import type { ContactImportRecord } from "@/modules/customers/contact-import";

export async function listCustomers(businessId: string) {
  return prisma.customer.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function importPotentialCustomers({
  businessId,
  actorId,
  records,
}: {
  businessId: string;
  actorId: string;
  records: ContactImportRecord[];
}) {
  return prisma.$transaction(async (tx) => {
    let createdCustomers = 0;
    let updatedCustomers = 0;
    let createdLeads = 0;

    for (const record of records) {
      const existing = await tx.customer.findUnique({
        where: {
          businessId_normalizedPhoneNumber: {
            businessId,
            normalizedPhoneNumber: record.normalizedPhoneNumber,
          },
        },
      });

      const customer = existing
        ? await tx.customer.update({
            where: { id: existing.id },
            data: {
              fullName: record.fullName,
              phoneNumber: record.phoneNumber,
              email: record.email ?? existing.email,
              city: record.city ?? existing.city,
              notes: record.notes ?? existing.notes,
              tags: [...new Set([...existing.tags, ...record.tags, "imported-lead"])],
              source: existing.source ?? "csv_import",
              ...(record.marketingOptIn === undefined
                ? {}
                : {
                    marketingOptIn: record.marketingOptIn,
                    marketingOptInAt: record.marketingOptIn ? existing.marketingOptInAt ?? new Date() : null,
                    marketingOptOutAt: record.marketingOptIn
                      ? null
                      : existing.marketingOptOutAt ?? new Date(),
                  }),
            },
          })
        : await tx.customer.create({
            data: {
              businessId,
              fullName: record.fullName,
              phoneNumber: record.phoneNumber,
              normalizedPhoneNumber: record.normalizedPhoneNumber,
              email: record.email,
              city: record.city,
              notes: record.notes,
              tags: [...new Set([...record.tags, "imported-lead"])],
              source: "csv_import",
              marketingOptIn: record.marketingOptIn ?? false,
              marketingOptInAt: record.marketingOptIn ? new Date() : null,
            },
          });

      if (existing) updatedCustomers += 1;
      else createdCustomers += 1;

      const openLead = await tx.lead.findFirst({
        where: {
          businessId,
          customerId: customer.id,
          stage: { notIn: ["CONVERTED", "LOST"] },
        },
        select: { id: true },
      });

      if (!openLead) {
        await tx.lead.create({
          data: {
            businessId,
            customerId: customer.id,
            stage: "NEW",
            source: "csv_import",
            structuredData: { importedRow: record.row },
          },
        });
        createdLeads += 1;
      }
    }

    const summary = { createdCustomers, updatedCustomers, createdLeads };
    await tx.auditLog.create({
      data: {
        businessId,
        actorId,
        action: "CONTACTS_IMPORTED",
        entityType: "CustomerImport",
        entityId: `csv-${Date.now()}`,
        afterState: summary,
      },
    });

    return summary;
  }, { maxWait: 10_000, timeout: 60_000 });
}
