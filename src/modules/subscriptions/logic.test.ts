import { describe, expect, it } from "vitest";

import {
  calculateExpiryDate,
  getSubscriptionLifecycleStatus,
} from "@/modules/subscriptions/logic";

describe("subscription logic", () => {
  it("calculates monthly expiry dates", () => {
    const expiry = calculateExpiryDate(
      new Date("2026-07-31T00:00:00.000Z"),
      "MONTHLY",
      30,
    );

    expect(expiry.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("marks subscriptions expiring within threshold", () => {
    expect(
      getSubscriptionLifecycleStatus({
        expiryDate: new Date("2026-08-05T00:00:00.000Z"),
        now: new Date("2026-07-31T00:00:00.000Z"),
        expiringThresholdDays: 7,
      }),
    ).toBe("EXPIRING");
  });

  it("marks past subscriptions expired", () => {
    expect(
      getSubscriptionLifecycleStatus({
        expiryDate: new Date("2026-07-30T00:00:00.000Z"),
        now: new Date("2026-07-31T00:00:00.000Z"),
        expiringThresholdDays: 7,
      }),
    ).toBe("EXPIRED");
  });
});
