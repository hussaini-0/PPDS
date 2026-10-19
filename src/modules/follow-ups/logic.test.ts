import { describe, expect, it } from "vitest";

import { evaluateFollowUpEligibility } from "@/modules/follow-ups/logic";

const baseInput = {
  leadStage: "PLAN_RECOMMENDED" as const,
  expectedStage: "PLAN_RECOMMENDED" as const,
  convertedAt: null,
  lostAt: null,
  marketingOptIn: true,
  marketingOptOutAt: null,
  humanTakeover: false,
  complaintState: false,
  lastInboundMessageAt: null,
  scheduledAt: new Date("2026-07-31T10:00:00.000Z"),
  serviceWindowExpiresAt: new Date(Date.now() + 60_000),
  requiresTemplate: false,
  templateAvailable: true,
  followUpCount: 0,
  maxFollowUps: 3,
};

describe("follow-up eligibility", () => {
  it("allows an eligible follow-up", () => {
    expect(evaluateFollowUpEligibility(baseInput).eligible).toBe(true);
  });

  it("blocks follow-up after opt-out", () => {
    expect(
      evaluateFollowUpEligibility({
        ...baseInput,
        marketingOptIn: false,
      }).eligible,
    ).toBe(false);
  });

  it("blocks stale scheduled follow-up after customer reply", () => {
    expect(
      evaluateFollowUpEligibility({
        ...baseInput,
        lastInboundMessageAt: new Date("2026-07-31T11:00:00.000Z"),
      }).eligible,
    ).toBe(false);
  });
});
