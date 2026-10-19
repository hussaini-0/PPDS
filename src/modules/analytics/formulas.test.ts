import { describe, expect, it } from "vitest";

import {
  calculateAttributedRoas,
  calculateAverageRevenuePerUser,
  calculateBotEscalationRate,
  calculateFunnelDropoff,
  calculateLeadConversionRate,
  calculateRenewalRiskRate,
} from "@/modules/analytics/formulas";

describe("analytics formulas", () => {
  it("guards divide-by-zero", () => {
    expect(calculateLeadConversionRate(5, 0)).toBe(0);
  });

  it("calculates attributed roas", () => {
    expect(calculateAttributedRoas(1000, 250)).toBe(4);
  });

  it("calculates funnel and revenue ratios safely", () => {
    expect(calculateFunnelDropoff(60, 100)).toBe(0.4);
    expect(calculateFunnelDropoff(10, 0)).toBe(0);
    expect(calculateAverageRevenuePerUser(1000, 4)).toBe(250);
    expect(calculateRenewalRiskRate(2, 8)).toBe(0.2);
    expect(calculateBotEscalationRate(3, 12)).toBe(0.25);
  });
});
