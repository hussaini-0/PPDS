import { LeadStage, SubscriptionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  type BroadcastRecipientCandidate,
  dedupeBroadcastCandidates,
  evaluateBroadcastEligibility,
  normalizeBroadcastFilter,
} from "@/modules/broadcasts/logic";

const baseCandidate: BroadcastRecipientCandidate = {
  customerId: "cus_1",
  customerName: "Ayesha Khan",
  normalizedPhoneNumber: "+923001234567",
  marketingOptIn: true,
  marketingOptOutAt: null,
  tags: ["vip"],
  lastContactAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  leadStages: [LeadStage.INTERESTED],
  leadMetaCampaignIds: ["cmp_1"],
  selectedPlanIds: ["plan_1"],
  subscriptionStatuses: [SubscriptionStatus.ACTIVE],
};

describe("broadcast audience logic", () => {
  it("allows consented active subscribers with required variables", () => {
    const result = evaluateBroadcastEligibility({
      candidate: baseCandidate,
      filter: normalizeBroadcastFilter({ segment: "ACTIVE_SUBSCRIBERS" }),
      requiredVariables: ["customerName"],
    });

    expect(result.eligible).toBe(true);
    expect(result.variables.customerName).toBe("Ayesha Khan");
  });

  it("blocks recipients without marketing consent by default", () => {
    const result = evaluateBroadcastEligibility({
      candidate: { ...baseCandidate, marketingOptIn: false },
      filter: normalizeBroadcastFilter({ segment: "ACTIVE_SUBSCRIBERS" }),
      requiredVariables: ["customerName"],
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("missing_marketing_consent");
  });

  it("blocks invalid phone numbers and explicit opt-outs", () => {
    const result = evaluateBroadcastEligibility({
      candidate: {
        ...baseCandidate,
        normalizedPhoneNumber: "03001234567",
        marketingOptOutAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      filter: normalizeBroadcastFilter({ segment: "ACTIVE_SUBSCRIBERS" }),
      requiredVariables: ["customerName"],
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons).toEqual(
      expect.arrayContaining(["invalid_phone_number", "marketing_opted_out"]),
    );
  });

  it("applies tag, plan, and recent-contact filters", () => {
    const result = evaluateBroadcastEligibility({
      candidate: {
        ...baseCandidate,
        lastContactAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      filter: normalizeBroadcastFilter({
        segment: "CUSTOMER_TAGS",
        tags: ["cold"],
        planId: "plan_2",
        notContactedSince: "2026-01-15",
      }),
      requiredVariables: ["customerName"],
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "tag_mismatch",
        "plan_filter_mismatch",
        "contacted_too_recently",
      ]),
    );
  });

  it("deduplicates repeated customer candidates", () => {
    const { deduped, duplicateCustomerIds } = dedupeBroadcastCandidates([
      baseCandidate,
      { ...baseCandidate, customerName: "Duplicate" },
    ]);

    expect(deduped).toHaveLength(1);
    expect(duplicateCustomerIds.has(baseCandidate.customerId)).toBe(true);
  });
});
