import { LeadStage, MessageSenderType, MessageStatus, SubscriptionStatus } from "@prisma/client";
import { subDays } from "date-fns";

import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  calculateAverageRevenuePerUser,
  calculateBotEscalationRate,
  calculateFunnelDropoff,
  calculateLeadConversionRate,
  calculateRenewalRiskRate,
} from "@/modules/analytics/formulas";

export async function getAnalyticsDashboard(businessId: string) {
  const since = subDays(new Date(), 30);
  const [
    business,
    leadCounts,
    payments,
    subscriptions,
    botMessages,
    failedOutboundMessages,
    escalatedLeads,
    auditLogs,
    revenueEvents,
  ] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.lead.groupBy({
      by: ["stage"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "VERIFIED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.message.count({
      where: {
        senderType: MessageSenderType.BOT,
        conversation: { businessId },
        createdAt: { gte: since },
      },
    }),
    prisma.message.count({
      where: {
        direction: "OUTBOUND",
        status: MessageStatus.FAILED,
        conversation: { businessId },
        createdAt: { gte: since },
      },
    }),
    prisma.lead.count({
      where: {
        businessId,
        humanAttentionRequired: true,
        updatedAt: { gte: since },
      },
    }),
    prisma.auditLog.findMany({
      where: { businessId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.attributionEvent.findMany({
      where: {
        businessId,
        eventType: "SUBSCRIPTION_CONVERTED",
        eventTime: { gte: since },
      },
      orderBy: { eventTime: "asc" },
    }),
  ]);

  const leadCount = (stage: LeadStage) =>
    leadCounts.find((item) => item.stage === stage)?._count._all ?? 0;
  const subscriptionCount = (status: SubscriptionStatus) =>
    subscriptions.find((item) => item.status === status)?._count._all ?? 0;
  const newLeads = leadCount(LeadStage.NEW) + leadCount(LeadStage.BOT_ENGAGED);
  const qualifiedLeads =
    leadCount(LeadStage.QUALIFIED) +
    leadCount(LeadStage.PLAN_RECOMMENDED) +
    leadCount(LeadStage.INTERESTED) +
    leadCount(LeadStage.PAYMENT_INSTRUCTIONS_SENT) +
    leadCount(LeadStage.PAYMENT_PROOF_RECEIVED);
  const convertedLeads = leadCount(LeadStage.CONVERTED);
  const activeSubscriptions = subscriptionCount(SubscriptionStatus.ACTIVE);
  const expiringSubscriptions = subscriptionCount(SubscriptionStatus.EXPIRING);
  const verifiedRevenue = Number(payments._sum.amount ?? 0);

  return {
    metrics: [
      {
        label: "Lead conversion",
        value: `${(calculateLeadConversionRate(convertedLeads, newLeads + qualifiedLeads + convertedLeads) * 100).toFixed(1)}%`,
        helper: `${convertedLeads} converted from ${newLeads + qualifiedLeads + convertedLeads} tracked leads`,
      },
      {
        label: "ARPU",
        value: formatCurrency(
          calculateAverageRevenuePerUser(verifiedRevenue, activeSubscriptions),
          business.currency,
        ),
        helper: `${activeSubscriptions} active subscriptions`,
      },
      {
        label: "Renewal risk",
        value: `${(calculateRenewalRiskRate(expiringSubscriptions, activeSubscriptions) * 100).toFixed(1)}%`,
        helper: `${expiringSubscriptions} expiring subscriptions`,
      },
      {
        label: "Bot escalation",
        value: `${(calculateBotEscalationRate(escalatedLeads, botMessages) * 100).toFixed(1)}%`,
        helper: `${escalatedLeads} escalations from ${botMessages} bot messages`,
      },
    ],
    funnel: [
      {
        label: "New or bot-engaged",
        count: newLeads,
        dropoff: 0,
      },
      {
        label: "Qualified or commercial",
        count: qualifiedLeads,
        dropoff: calculateFunnelDropoff(qualifiedLeads, newLeads),
      },
      {
        label: "Converted",
        count: convertedLeads,
        dropoff: calculateFunnelDropoff(convertedLeads, qualifiedLeads),
      },
    ],
    reliability: {
      failedOutboundMessages,
      auditedActionsLast30Days: auditLogs.length,
      latestAuditActions: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        createdAt: formatDate(log.createdAt),
      })),
    },
    revenueEvents: revenueEvents.map((event) => ({
      id: event.id,
      value: event.value ? formatCurrency(Number(event.value), event.currency ?? business.currency) : "No value",
      source: event.source ?? "Unknown",
      confidence: event.confidence,
      eventTime: formatDate(event.eventTime),
    })),
  };
}
