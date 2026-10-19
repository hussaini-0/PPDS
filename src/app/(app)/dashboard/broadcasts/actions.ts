"use server";

import { LeadStage, SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/session";
import { sendTestBroadcastSchema } from "@/modules/broadcasts/schemas";
import {
  cancelBroadcastCampaign,
  createBroadcastCampaign,
  executeBroadcastCampaign,
  pauseBroadcastCampaign,
  scheduleBroadcastCampaign,
  sendTestBroadcast,
} from "@/modules/broadcasts/service";

function splitCsv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createCampaignAction(formData: FormData) {
  const session = await requirePermission("CREATE_BROADCASTS");
  const segment = String(formData.get("segment") ?? "ACTIVE_SUBSCRIBERS");
  const leadStages = splitCsv(formData.get("leadStages")).filter((stage) =>
    Object.values(LeadStage).includes(stage as LeadStage),
  ) as LeadStage[];
  const subscriptionStatuses = splitCsv(formData.get("subscriptionStatuses")).filter(
    (status) => Object.values(SubscriptionStatus).includes(status as SubscriptionStatus),
  ) as SubscriptionStatus[];

  await createBroadcastCampaign({
    businessId: session.user.businessId,
    actorId: session.user.id,
    input: {
      name: String(formData.get("name") ?? ""),
      templateId: String(formData.get("templateId") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? "") || undefined,
      audienceFilter: {
        segment,
        requireMarketingConsent: formData.get("requireMarketingConsent") === "on",
        leadStages,
        subscriptionStatuses,
        tags: splitCsv(formData.get("tags")),
        metaCampaignId: String(formData.get("metaCampaignId") ?? "") || undefined,
        planId: String(formData.get("planId") ?? "") || undefined,
        createdFrom: String(formData.get("createdFrom") ?? "") || undefined,
        createdTo: String(formData.get("createdTo") ?? "") || undefined,
        notContactedSince:
          String(formData.get("notContactedSince") ?? "") || undefined,
      },
    },
  });

  revalidatePath("/dashboard/broadcasts");
}

export async function scheduleCampaignAction(formData: FormData) {
  const session = await requirePermission("CREATE_BROADCASTS");
  await scheduleBroadcastCampaign({
    businessId: session.user.businessId,
    actorId: session.user.id,
    campaignId: String(formData.get("campaignId") ?? ""),
  });
  revalidatePath("/dashboard/broadcasts");
}

export async function pauseCampaignAction(formData: FormData) {
  const session = await requirePermission("CREATE_BROADCASTS");
  await pauseBroadcastCampaign({
    businessId: session.user.businessId,
    actorId: session.user.id,
    campaignId: String(formData.get("campaignId") ?? ""),
  });
  revalidatePath("/dashboard/broadcasts");
}

export async function cancelCampaignAction(formData: FormData) {
  const session = await requirePermission("CREATE_BROADCASTS");
  await cancelBroadcastCampaign({
    businessId: session.user.businessId,
    actorId: session.user.id,
    campaignId: String(formData.get("campaignId") ?? ""),
  });
  revalidatePath("/dashboard/broadcasts");
}

export async function runCampaignNowAction(formData: FormData) {
  await requirePermission("CREATE_BROADCASTS");
  await executeBroadcastCampaign(String(formData.get("campaignId") ?? ""));
  revalidatePath("/dashboard/broadcasts");
}

export async function sendTestBroadcastAction(formData: FormData) {
  const session = await requirePermission("CREATE_BROADCASTS");
  const parsed = sendTestBroadcastSchema.parse({
    templateId: String(formData.get("templateId") ?? ""),
    phoneNumber: String(formData.get("phoneNumber") ?? ""),
    customerName: String(formData.get("customerName") ?? "Test Customer"),
  });

  await sendTestBroadcast({
    businessId: session.user.businessId,
    actorId: session.user.id,
    ...parsed,
  });

  revalidatePath("/dashboard/broadcasts");
}
