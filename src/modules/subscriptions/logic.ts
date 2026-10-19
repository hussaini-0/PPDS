import { addDays, addMonths, addYears } from "date-fns";

export function calculateExpiryDate(
  startDate: Date,
  billingInterval: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM",
  durationDays: number,
) {
  switch (billingInterval) {
    case "MONTHLY":
      return addMonths(startDate, 1);
    case "QUARTERLY":
      return addMonths(startDate, 3);
    case "YEARLY":
      return addYears(startDate, 1);
    case "CUSTOM":
    default:
      return addDays(startDate, durationDays);
  }
}

export function getSubscriptionLifecycleStatus({
  expiryDate,
  now,
  expiringThresholdDays,
}: {
  expiryDate: Date;
  now: Date;
  expiringThresholdDays: number;
}) {
  if (expiryDate < now) return "EXPIRED" as const;

  const expiringFrom = addDays(now, expiringThresholdDays);

  if (expiryDate <= expiringFrom) return "EXPIRING" as const;

  return "ACTIVE" as const;
}
