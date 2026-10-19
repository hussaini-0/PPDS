import { LeadStage, SubscriptionStatus } from "@prisma/client";

export const broadcastAudienceSegments = [
  "ACTIVE_SUBSCRIBERS",
  "EXPIRING_SUBSCRIBERS",
  "EXPIRED_SUBSCRIBERS",
  "LEADS_BY_STAGE",
  "PAYMENT_INSTRUCTIONS_NO_PROOF",
  "META_CAMPAIGN",
  "CUSTOMER_TAGS",
] as const;

export type BroadcastAudienceSegment = (typeof broadcastAudienceSegments)[number];

export type BroadcastAudienceFilter = {
  segment: BroadcastAudienceSegment;
  requireMarketingConsent: boolean;
  leadStages?: LeadStage[];
  subscriptionStatuses?: SubscriptionStatus[];
  tags?: string[];
  metaCampaignId?: string;
  planId?: string;
  createdFrom?: string;
  createdTo?: string;
  notContactedSince?: string;
};

export type BroadcastRecipientCandidate = {
  customerId: string;
  customerName: string;
  normalizedPhoneNumber: string;
  marketingOptIn: boolean;
  marketingOptOutAt: Date | null;
  tags: string[];
  lastContactAt: Date | null;
  createdAt: Date;
  leadStages: LeadStage[];
  leadMetaCampaignIds: string[];
  selectedPlanIds: string[];
  subscriptionStatuses: SubscriptionStatus[];
};

export type BroadcastEligibilityResult = {
  eligible: boolean;
  reasons: string[];
  variables: Record<string, string>;
};

const e164Pattern = /^\+[1-9]\d{7,14}$/;

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeBroadcastFilter(
  filter: Partial<BroadcastAudienceFilter>,
): BroadcastAudienceFilter {
  return {
    segment: filter.segment ?? "ACTIVE_SUBSCRIBERS",
    requireMarketingConsent: filter.requireMarketingConsent ?? true,
    leadStages: filter.leadStages?.length ? filter.leadStages : undefined,
    subscriptionStatuses: filter.subscriptionStatuses?.length
      ? filter.subscriptionStatuses
      : undefined,
    tags: filter.tags?.map((tag) => tag.trim()).filter(Boolean),
    metaCampaignId: filter.metaCampaignId?.trim() || undefined,
    planId: filter.planId?.trim() || undefined,
    createdFrom: filter.createdFrom || undefined,
    createdTo: filter.createdTo || undefined,
    notContactedSince: filter.notContactedSince || undefined,
  };
}

export function resolveTemplateVariables({
  candidate,
  requiredVariables,
}: {
  candidate: BroadcastRecipientCandidate;
  requiredVariables: string[];
}) {
  const variables: Record<string, string> = {
    customerName: candidate.customerName,
  };

  const missingVariables = requiredVariables.filter((variable) => {
    const value = variables[variable];
    return !value || value.trim().length === 0;
  });

  return { variables, missingVariables };
}

export function evaluateBroadcastEligibility({
  candidate,
  filter,
  requiredVariables,
}: {
  candidate: BroadcastRecipientCandidate;
  filter: BroadcastAudienceFilter;
  requiredVariables: string[];
}): BroadcastEligibilityResult {
  const reasons: string[] = [];

  if (!e164Pattern.test(candidate.normalizedPhoneNumber)) {
    reasons.push("invalid_phone_number");
  }

  if (filter.requireMarketingConsent && !candidate.marketingOptIn) {
    reasons.push("missing_marketing_consent");
  }

  if (candidate.marketingOptOutAt) {
    reasons.push("marketing_opted_out");
  }

  const createdFrom = parseOptionalDate(filter.createdFrom);
  if (createdFrom && candidate.createdAt < createdFrom) {
    reasons.push("outside_created_from_window");
  }

  const createdTo = parseOptionalDate(filter.createdTo);
  if (createdTo && candidate.createdAt > createdTo) {
    reasons.push("outside_created_to_window");
  }

  const notContactedSince = parseOptionalDate(filter.notContactedSince);
  if (
    notContactedSince &&
    candidate.lastContactAt &&
    candidate.lastContactAt > notContactedSince
  ) {
    reasons.push("contacted_too_recently");
  }

  if (filter.planId && !candidate.selectedPlanIds.includes(filter.planId)) {
    reasons.push("plan_filter_mismatch");
  }

  if (
    filter.segment === "LEADS_BY_STAGE" &&
    filter.leadStages?.length &&
    !candidate.leadStages.some((stage) => filter.leadStages?.includes(stage))
  ) {
    reasons.push("lead_stage_mismatch");
  }

  if (
    filter.segment === "PAYMENT_INSTRUCTIONS_NO_PROOF" &&
    !candidate.leadStages.includes(LeadStage.PAYMENT_INSTRUCTIONS_SENT)
  ) {
    reasons.push("payment_instructions_missing");
  }

  if (
    filter.segment === "META_CAMPAIGN" &&
    filter.metaCampaignId &&
    !candidate.leadMetaCampaignIds.includes(filter.metaCampaignId)
  ) {
    reasons.push("meta_campaign_mismatch");
  }

  if (
    filter.segment === "CUSTOMER_TAGS" &&
    filter.tags?.length &&
    !filter.tags.some((tag) => candidate.tags.includes(tag))
  ) {
    reasons.push("tag_mismatch");
  }

  const subscriptionStatuses =
    filter.segment === "ACTIVE_SUBSCRIBERS"
      ? [SubscriptionStatus.ACTIVE]
      : filter.segment === "EXPIRING_SUBSCRIBERS"
        ? [SubscriptionStatus.EXPIRING]
        : filter.segment === "EXPIRED_SUBSCRIBERS"
          ? [SubscriptionStatus.EXPIRED]
          : filter.subscriptionStatuses;

  if (
    subscriptionStatuses?.length &&
    !candidate.subscriptionStatuses.some((status) => subscriptionStatuses.includes(status))
  ) {
    reasons.push("subscription_status_mismatch");
  }

  const { variables, missingVariables } = resolveTemplateVariables({
    candidate,
    requiredVariables,
  });

  if (missingVariables.length > 0) {
    reasons.push(`missing_template_variables:${missingVariables.join(",")}`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    variables,
  };
}

export function dedupeBroadcastCandidates(candidates: BroadcastRecipientCandidate[]) {
  const seen = new Set<string>();
  const deduped: BroadcastRecipientCandidate[] = [];
  const duplicateCustomerIds = new Set<string>();

  for (const candidate of candidates) {
    if (seen.has(candidate.customerId)) {
      duplicateCustomerIds.add(candidate.customerId);
      continue;
    }

    seen.add(candidate.customerId);
    deduped.push(candidate);
  }

  return { deduped, duplicateCustomerIds };
}
