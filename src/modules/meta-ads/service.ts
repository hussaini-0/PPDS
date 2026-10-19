import { subDays } from "date-fns";
import { MetaEntityStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { assertMockMode } from "@/modules/integrations/mode";
import {
  buildMetaConversionEvent,
  calculateCostPerLead,
  calculateCpc,
  calculateCpm,
  calculateCtr,
  calculateMetaRoas,
  summarizeMetaInsights,
  type MetaInsightTotals,
} from "@/modules/meta-ads/logic";

type CampaignPerformance = MetaInsightTotals & {
  campaignId: string;
  campaignName: string;
  status: MetaEntityStatus;
};

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0);
}

function rawPayloadObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function getMetaAdsDashboard(businessId: string) {
  const since = subDays(new Date(), 30);
  const [business, accounts, insights, attributionEvents, campaigns] =
    await Promise.all([
      prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
      prisma.metaAdAccount.findMany({
        where: { businessId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.metaDailyInsight.findMany({
        where: { businessId, date: { gte: since } },
        include: { campaign: true, adSet: true, ad: true },
        orderBy: { date: "desc" },
      }),
      prisma.attributionEvent.findMany({
        where: {
          businessId,
          metaCampaignId: { not: null },
        },
        include: {
          customer: true,
          lead: true,
          subscription: { include: { plan: true } },
        },
        orderBy: { eventTime: "desc" },
        take: 50,
      }),
      prisma.metaCampaign.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
      }),
    ]);

  const revenueByCampaign = new Map<string, number>();
  const conversionsByCampaign = new Map<string, number>();

  for (const event of attributionEvents) {
    if (!event.metaCampaignId) continue;
    revenueByCampaign.set(
      event.metaCampaignId,
      (revenueByCampaign.get(event.metaCampaignId) ?? 0) + toNumber(event.value),
    );
    conversionsByCampaign.set(
      event.metaCampaignId,
      (conversionsByCampaign.get(event.metaCampaignId) ?? 0) + 1,
    );
  }

  const rows: MetaInsightTotals[] = insights.map((insight) => ({
    spend: toNumber(insight.spend),
    impressions: insight.impressions,
    reach: insight.reach,
    clicks: insight.clicks,
    outboundClicks: insight.outboundClicks,
    conversationsStarted: insight.conversationsStarted,
    leads: insight.leads,
    conversions: insight.conversions,
    attributedRevenue: insight.campaignId
      ? revenueByCampaign.get(insight.campaignId) ?? 0
      : 0,
  }));
  const totals = summarizeMetaInsights(rows);

  const performanceByCampaign = new Map<string, CampaignPerformance>();
  for (const campaign of campaigns) {
    performanceByCampaign.set(campaign.id, {
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      outboundClicks: 0,
      conversationsStarted: 0,
      leads: 0,
      conversions: conversionsByCampaign.get(campaign.id) ?? 0,
      attributedRevenue: revenueByCampaign.get(campaign.id) ?? 0,
    });
  }

  for (const insight of insights) {
    if (!insight.campaignId || !insight.campaign) continue;
    const existing =
      performanceByCampaign.get(insight.campaignId) ??
      ({
        campaignId: insight.campaignId,
        campaignName: insight.campaign.name,
        status: insight.campaign.status,
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        outboundClicks: 0,
        conversationsStarted: 0,
        leads: 0,
        conversions: conversionsByCampaign.get(insight.campaignId) ?? 0,
        attributedRevenue: revenueByCampaign.get(insight.campaignId) ?? 0,
      } satisfies CampaignPerformance);

    existing.spend += toNumber(insight.spend);
    existing.impressions += insight.impressions;
    existing.reach += insight.reach;
    existing.clicks += insight.clicks;
    existing.outboundClicks += insight.outboundClicks;
    existing.conversationsStarted += insight.conversationsStarted;
    existing.leads += insight.leads;
    performanceByCampaign.set(insight.campaignId, existing);
  }

  return {
    currency: business.currency,
    accounts,
    totals,
    metrics: [
      {
        label: "Meta spend",
        value: formatCurrency(totals.spend, business.currency),
        helper: `${totals.impressions.toLocaleString()} impressions in 30 days`,
      },
      {
        label: "Cost per lead",
        value: formatCurrency(calculateCostPerLead(totals.spend, totals.leads), business.currency),
        helper: `${totals.leads} leads from click-to-message campaigns`,
      },
      {
        label: "CTR",
        value: `${(calculateCtr(totals.clicks, totals.impressions) * 100).toFixed(2)}%`,
        helper: `${totals.clicks.toLocaleString()} total clicks`,
      },
      {
        label: "Attributed ROAS",
        value: `${calculateMetaRoas(totals.attributedRevenue, totals.spend).toFixed(2)}x`,
        helper: formatCurrency(totals.attributedRevenue, business.currency),
      },
    ],
    ratios: {
      cpc: calculateCpc(totals.spend, totals.clicks),
      cpm: calculateCpm(totals.spend, totals.impressions),
      ctr: calculateCtr(totals.clicks, totals.impressions),
      costPerLead: calculateCostPerLead(totals.spend, totals.leads),
      roas: calculateMetaRoas(totals.attributedRevenue, totals.spend),
    },
    campaignPerformance: Array.from(performanceByCampaign.values()).sort(
      (a, b) => b.spend - a.spend,
    ),
    recentAttributions: attributionEvents.slice(0, 10).map((event) => ({
      id: event.id,
      customerName: event.customer.fullName,
      eventType: event.eventType,
      eventTime: formatDate(event.eventTime),
      value: event.value ? formatCurrency(toNumber(event.value), event.currency ?? business.currency) : null,
      campaignId: event.metaCampaignId,
      confidence: event.confidence,
      planName: event.subscription?.plan.name ?? null,
    })),
    latestInsights: insights.slice(0, 12).map((insight) => ({
      id: insight.id,
      date: formatDate(insight.date),
      campaignName: insight.campaign?.name ?? "Account total",
      adSetName: insight.adSet?.name ?? "All ad sets",
      adName: insight.ad?.name ?? "All ads",
      spend: formatCurrency(toNumber(insight.spend), business.currency),
      leads: insight.leads,
      conversions: insight.conversions,
    })),
  };
}

export async function syncMockMetaAds({
  businessId,
  actorId,
}: {
  businessId: string;
  actorId: string;
}) {
  assertMockMode("Mock Meta Ads sync");

  const account = await prisma.metaAdAccount.findFirstOrThrow({
    where: { businessId, isActive: true },
    include: {
      campaigns: {
        include: {
          adSets: { include: { ads: true } },
        },
      },
    },
  });
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  let syncedRows = 0;

  for (const campaign of account.campaigns) {
    for (const adSet of campaign.adSets) {
      for (const ad of adSet.ads) {
        const existing = await prisma.metaDailyInsight.findFirst({
          where: {
            accountId: account.id,
            date,
            campaignId: campaign.id,
            adSetId: adSet.id,
            adId: ad.id,
          },
        });
        const data = {
          businessId,
          accountId: account.id,
          campaignId: campaign.id,
          adSetId: adSet.id,
          adId: ad.id,
          date,
          spend: new Prisma.Decimal(1350 + syncedRows * 75),
          impressions: 1400 + syncedRows * 120,
          reach: 980 + syncedRows * 80,
          clicks: 96 + syncedRows * 7,
          outboundClicks: 48 + syncedRows * 5,
          conversationsStarted: 14 + syncedRows,
          leads: 10 + syncedRows,
          conversions: 2,
          costPerResult: new Prisma.Decimal(120),
          cpc: new Prisma.Decimal(18),
          cpm: new Prisma.Decimal(92),
          ctr: new Prisma.Decimal(4.8),
          rawPayload: {
            mode: "mock",
            syncedAt: new Date().toISOString(),
            externalAdId: ad.externalAdId,
          },
        };

        if (existing) {
          await prisma.metaDailyInsight.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await prisma.metaDailyInsight.create({ data });
        }
        syncedRows += 1;
      }
    }
  }

  await prisma.metaAdAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: "meta_ads_mock_sync_completed",
      entityType: "MetaAdAccount",
      entityId: account.id,
      afterState: { syncedRows },
    },
  });

  return { syncedRows };
}

export async function sendPendingMetaConversionEvents({
  businessId,
  actorId,
}: {
  businessId: string;
  actorId: string;
}) {
  assertMockMode("Mock Meta conversion dispatch");

  const events = await prisma.attributionEvent.findMany({
    where: {
      businessId,
      metaCampaignId: { not: null },
      eventTime: { gte: subDays(new Date(), 90) },
    },
    orderBy: { eventTime: "asc" },
    take: 100,
  });

  const pending = events.filter((event) => {
    const raw = rawPayloadObject(event.rawPayload);
    return raw.metaConversionSentAt === undefined;
  });

  for (const event of pending) {
    const payload = buildMetaConversionEvent({
      eventId: event.externalEventId ?? event.id,
      eventName: event.eventType,
      eventTime: event.eventTime,
      value: event.value ? toNumber(event.value) : undefined,
      currency: event.currency ?? undefined,
      clickId: event.clickId,
      source: event.source,
    });

    await prisma.attributionEvent.update({
      where: { id: event.id },
      data: {
        rawPayload: {
          ...rawPayloadObject(event.rawPayload),
          metaConversionPayload: payload,
          metaConversionSentAt: new Date().toISOString(),
          mode: "mock",
        },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: "meta_conversion_events_sent",
      entityType: "AttributionEvent",
      entityId: "bulk",
      afterState: { sentCount: pending.length },
    },
  });

  return { sentCount: pending.length };
}
