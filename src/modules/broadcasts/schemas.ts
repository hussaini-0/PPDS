import { LeadStage, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";

import { broadcastAudienceSegments } from "@/modules/broadcasts/logic";

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const broadcastAudienceFilterSchema = z.object({
  segment: z.enum(broadcastAudienceSegments).default("ACTIVE_SUBSCRIBERS"),
  requireMarketingConsent: z.coerce.boolean().default(true),
  leadStages: z.array(z.enum(LeadStage)).optional(),
  subscriptionStatuses: z.array(z.enum(SubscriptionStatus)).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  metaCampaignId: z.string().trim().optional(),
  planId: z.string().trim().optional(),
  createdFrom: optionalDateString,
  createdTo: optionalDateString,
  notContactedSince: optionalDateString,
});

export const createBroadcastCampaignSchema = z.object({
  name: z.string().trim().min(3).max(120),
  templateId: z.string().trim().min(1),
  scheduledAt: optionalDateString,
  audienceFilter: broadcastAudienceFilterSchema,
});

export const sendTestBroadcastSchema = z.object({
  templateId: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(8),
  customerName: z.string().trim().min(1).max(120).default("Test Customer"),
});

export type CreateBroadcastCampaignInput = z.infer<
  typeof createBroadcastCampaignSchema
>;
