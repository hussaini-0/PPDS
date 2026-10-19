import { describe, expect, it } from "vitest";

import {
  buildMetaConversionEvent,
  calculateCostPerLead,
  calculateCpc,
  calculateCpm,
  calculateCtr,
  calculateMetaRoas,
  summarizeMetaInsights,
} from "@/modules/meta-ads/logic";

describe("meta ads logic", () => {
  it("calculates paid media ratios with divide-by-zero guards", () => {
    expect(calculateCtr(50, 1000)).toBe(0.05);
    expect(calculateCpc(1000, 50)).toBe(20);
    expect(calculateCpm(1000, 10000)).toBe(100);
    expect(calculateCostPerLead(1000, 10)).toBe(100);
    expect(calculateMetaRoas(4000, 1000)).toBe(4);
    expect(calculateCtr(1, 0)).toBe(0);
  });

  it("summarizes insight rows", () => {
    const totals = summarizeMetaInsights([
      {
        spend: 100,
        impressions: 1000,
        reach: 700,
        clicks: 30,
        outboundClicks: 20,
        conversationsStarted: 5,
        leads: 4,
        conversions: 1,
        attributedRevenue: 500,
      },
      {
        spend: 50,
        impressions: 500,
        reach: 300,
        clicks: 10,
        outboundClicks: 8,
        conversationsStarted: 2,
        leads: 1,
        conversions: 0,
        attributedRevenue: 0,
      },
    ]);

    expect(totals).toMatchObject({
      spend: 150,
      impressions: 1500,
      leads: 5,
      attributedRevenue: 500,
    });
  });

  it("builds a Meta conversions API payload shape", () => {
    const payload = buildMetaConversionEvent({
      eventId: "evt_1",
      eventName: "Subscribe",
      eventTime: new Date("2026-07-31T10:00:00.000Z"),
      value: 9500,
      currency: "PKR",
      clickId: "fbclid_1",
      source: "META_CLICK_TO_WHATSAPP",
    });

    expect(payload).toMatchObject({
      event_id: "evt_1",
      event_name: "Subscribe",
      action_source: "business_messaging",
      custom_data: {
        value: 9500,
        currency: "PKR",
        click_id: "fbclid_1",
      },
    });
  });
});
