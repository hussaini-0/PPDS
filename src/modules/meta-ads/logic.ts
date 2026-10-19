export type MetaInsightTotals = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  outboundClicks: number;
  conversationsStarted: number;
  leads: number;
  conversions: number;
  attributedRevenue: number;
};

export function safeRatio(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function calculateCtr(clicks: number, impressions: number) {
  return safeRatio(clicks, impressions);
}

export function calculateCpc(spend: number, clicks: number) {
  return safeRatio(spend, clicks);
}

export function calculateCpm(spend: number, impressions: number) {
  return safeRatio(spend * 1000, impressions);
}

export function calculateCostPerLead(spend: number, leads: number) {
  return safeRatio(spend, leads);
}

export function calculateMetaRoas(attributedRevenue: number, spend: number) {
  return safeRatio(attributedRevenue, spend);
}

export function buildMetaConversionEvent({
  eventId,
  eventName,
  eventTime,
  value,
  currency,
  clickId,
  source,
}: {
  eventId: string;
  eventName: string;
  eventTime: Date;
  value?: number;
  currency?: string;
  clickId?: string | null;
  source?: string | null;
}) {
  return {
    event_id: eventId,
    event_name: eventName,
    event_time: Math.floor(eventTime.getTime() / 1000),
    action_source: "business_messaging",
    custom_data: {
      value,
      currency,
      click_id: clickId ?? undefined,
      source: source ?? undefined,
    },
  };
}

export function summarizeMetaInsights(rows: MetaInsightTotals[]) {
  return rows.reduce<MetaInsightTotals>(
    (total, row) => ({
      spend: total.spend + row.spend,
      impressions: total.impressions + row.impressions,
      reach: total.reach + row.reach,
      clicks: total.clicks + row.clicks,
      outboundClicks: total.outboundClicks + row.outboundClicks,
      conversationsStarted:
        total.conversationsStarted + row.conversationsStarted,
      leads: total.leads + row.leads,
      conversions: total.conversions + row.conversions,
      attributedRevenue: total.attributedRevenue + row.attributedRevenue,
    }),
    {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      outboundClicks: 0,
      conversationsStarted: 0,
      leads: 0,
      conversions: 0,
      attributedRevenue: 0,
    },
  );
}
