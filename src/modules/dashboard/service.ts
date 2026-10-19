import { LeadStage, SubscriptionStatus } from "@prisma/client";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardSnapshot } from "@/types/dashboard";

export async function getDashboardSnapshot(
  businessId: string,
): Promise<DashboardSnapshot> {
  const [business, leadCounts, attentionItems, subscriptions, payments, topLeads] =
    await Promise.all([
      prisma.business.findUniqueOrThrow({
        where: { id: businessId },
      }),
      prisma.lead.groupBy({
        by: ["stage"],
        where: { businessId },
        _count: { _all: true },
      }),
      prisma.ownerAttentionItem.findMany({
        where: { businessId, status: "OPEN" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 6,
        include: {
          customer: true,
          lead: true,
        },
      }),
      prisma.subscription.findMany({
        where: {
          businessId,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRING] },
        },
        orderBy: { expiryDate: "asc" },
        take: 5,
        include: {
          customer: true,
          plan: true,
        },
      }),
      prisma.payment.aggregate({
        where: { businessId, status: "VERIFIED" },
        _sum: { amount: true },
      }),
      prisma.lead.findMany({
        where: { businessId },
        orderBy: [{ intentScore: "desc" }, { updatedAt: "desc" }],
        take: 5,
        include: { customer: true },
      }),
    ]);

  const getCount = (stage: LeadStage) =>
    leadCounts.find((item) => item.stage === stage)?._count._all ?? 0;

  const verifiedRevenue = Number(payments._sum.amount ?? 0);
  const converted = getCount(LeadStage.CONVERTED);
  const newLeads = getCount(LeadStage.NEW) + getCount(LeadStage.BOT_ENGAGED);
  const conversionRate = newLeads === 0 ? 0 : Math.round((converted / newLeads) * 100);

  return {
    businessName: business.name,
    timezone: business.timezone,
    integrationMode: env.INTEGRATION_MODE,
    metrics: [
      {
        label: "Open attention items",
        value: String(attentionItems.length),
        helper: "Owner queue items requiring action now",
      },
      {
        label: "Converted leads",
        value: String(converted),
        helper: `${conversionRate}% lead conversion from new or bot-engaged`,
      },
      {
        label: "Verified revenue",
        value: formatCurrency(verifiedRevenue, business.currency),
        helper: "Revenue includes verified payments only",
      },
      {
        label: "Expiring subscriptions",
        value: String(
          subscriptions.filter((subscription) => subscription.status === "EXPIRING")
            .length,
        ),
        helper: "Subscriptions already flagged for renewal action",
      },
    ],
    attentionQueue: attentionItems.map((item) => ({
      id: item.id,
      customerName: item.customer?.fullName ?? "Unknown customer",
      reason: item.reason,
      priority: item.priority,
      stage: item.lead?.stage ?? null,
      waitingSince: formatDate(item.createdAt),
      recommendedAction: item.recommendedAction,
    })),
    topLeads: topLeads.map((lead) => ({
      id: lead.id,
      customerName: lead.customer.fullName,
      stage: lead.stage,
      intentScore: lead.intentScore,
      nextFollowUpAt: lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : null,
    })),
    subscriptionsExpiring: subscriptions.map((subscription) => ({
      id: subscription.id,
      customerName: subscription.customer.fullName,
      planName: subscription.plan.name,
      expiryDate: formatDate(subscription.expiryDate),
      status: subscription.status,
    })),
  };
}
