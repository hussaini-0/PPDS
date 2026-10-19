import {
  BroadcastRecipientStatus,
  BroadcastStatus,
  ConversationChannel,
  ConversationStatus,
  MessageDirection,
  MessageSenderType,
  MessageStatus,
  MessageType,
  Prisma,
  TemplateStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/modules/whatsapp/client";
import { normalizePhoneNumber } from "@/lib/phone";
import { getBroadcastQueue } from "@/server/jobs/queues";
import {
  type BroadcastAudienceFilter,
  type BroadcastRecipientCandidate,
  dedupeBroadcastCandidates,
  evaluateBroadcastEligibility,
  normalizeBroadcastFilter,
} from "@/modules/broadcasts/logic";
import { createBroadcastCampaignSchema } from "@/modules/broadcasts/schemas";

const schedulableStatuses: BroadcastStatus[] = [
  BroadcastStatus.DRAFT,
  BroadcastStatus.PAUSED,
];
const pausableStatuses: BroadcastStatus[] = [
  BroadcastStatus.SCHEDULED,
  BroadcastStatus.RUNNING,
];
const cancellableStatuses: BroadcastStatus[] = [
  BroadcastStatus.DRAFT,
  BroadcastStatus.SCHEDULED,
  BroadcastStatus.PAUSED,
  BroadcastStatus.RUNNING,
];
const executableStatuses: BroadcastStatus[] = [
  BroadcastStatus.SCHEDULED,
  BroadcastStatus.RUNNING,
];

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extractTemplateBody(components: unknown) {
  const componentObject = jsonObject(components);
  const body = componentObject.body;
  return typeof body === "string" ? body : "Approved WhatsApp template message.";
}

function extractRequiredVariables(variables: unknown) {
  const variableObject = jsonObject(variables);
  return Object.keys(variableObject);
}

function renderTemplateBody(body: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (content, [key, value]) =>
      content.replaceAll(`{{${key}}}`, value).replaceAll(`{{ ${key} }}`, value),
    body,
  );
}

async function enqueueBroadcastCampaign(campaignId: string, scheduledAt?: Date | null) {
  try {
    await getBroadcastQueue().add(
      "execute-campaign",
      { campaignId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        delay: scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0,
        jobId: `broadcast:${campaignId}`,
      },
    );
  } catch (error) {
    console.warn("Broadcast campaign was saved but could not be queued.", error);
  }
}

export async function previewBroadcastAudience({
  businessId,
  templateId,
  audienceFilter,
}: {
  businessId: string;
  templateId: string;
  audienceFilter: Partial<BroadcastAudienceFilter>;
}) {
  const [template, customers] = await Promise.all([
    prisma.whatsAppTemplate.findFirstOrThrow({
      where: { id: templateId, businessId, status: TemplateStatus.APPROVED },
    }),
    prisma.customer.findMany({
      where: { businessId },
      include: {
        leads: {
          select: {
            stage: true,
            metaCampaignId: true,
            selectedPlanId: true,
          },
        },
        subscriptions: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
  ]);

  const filter = normalizeBroadcastFilter(audienceFilter);
  const requiredVariables = extractRequiredVariables(template.variables);
  const candidates: BroadcastRecipientCandidate[] = customers.map((customer) => ({
    customerId: customer.id,
    customerName: customer.fullName,
    normalizedPhoneNumber: customer.normalizedPhoneNumber,
    marketingOptIn: customer.marketingOptIn,
    marketingOptOutAt: customer.marketingOptOutAt,
    tags: customer.tags,
    lastContactAt: customer.lastContactAt,
    createdAt: customer.createdAt,
    leadStages: customer.leads.map((lead) => lead.stage),
    leadMetaCampaignIds: customer.leads
      .map((lead) => lead.metaCampaignId)
      .filter((id): id is string => Boolean(id)),
    selectedPlanIds: customer.leads
      .map((lead) => lead.selectedPlanId)
      .filter((id): id is string => Boolean(id)),
    subscriptionStatuses: customer.subscriptions.map(
      (subscription) => subscription.status,
    ),
  }));

  const { deduped, duplicateCustomerIds } = dedupeBroadcastCandidates(candidates);
  const evaluated = deduped.map((candidate) => {
    const result = evaluateBroadcastEligibility({
      candidate,
      filter,
      requiredVariables,
    });

    return {
      ...candidate,
      ...result,
      reasons: duplicateCustomerIds.has(candidate.customerId)
        ? [...result.reasons, "duplicate_recipient"]
        : result.reasons,
    };
  });

  return {
    template,
    filter,
    eligible: evaluated.filter((item) => item.eligible),
    excluded: evaluated.filter((item) => !item.eligible),
  };
}

export async function createBroadcastCampaign({
  businessId,
  actorId,
  input,
}: {
  businessId: string;
  actorId: string;
  input: unknown;
}) {
  const parsed = createBroadcastCampaignSchema.parse(input);
  const preview = await previewBroadcastAudience({
    businessId,
    templateId: parsed.templateId,
    audienceFilter: parsed.audienceFilter,
  });

  if (preview.eligible.length === 0) {
    throw new Error("No eligible recipients matched this consent-safe audience.");
  }

  const scheduledAt = parsed.scheduledAt ? new Date(parsed.scheduledAt) : null;

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.broadcastCampaign.create({
      data: {
        businessId,
        name: parsed.name,
        templateId: parsed.templateId,
        status: BroadcastStatus.DRAFT,
        audienceFilter: preview.filter as Prisma.InputJsonValue,
        scheduledAt,
        createdByUserId: actorId,
        totalRecipients: preview.eligible.length,
        recipients: {
          create: preview.eligible.map((recipient) => ({
            customerId: recipient.customerId,
            personalizedVariables: recipient.variables as Prisma.InputJsonValue,
            status: BroadcastRecipientStatus.PENDING,
          })),
        },
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        actorId,
        action: "broadcast_campaign_created",
        entityType: "BroadcastCampaign",
        entityId: created.id,
        afterState: {
          totalRecipients: preview.eligible.length,
          excludedRecipients: preview.excluded.length,
          audienceFilter: preview.filter,
        },
      },
    });

    return created;
  });

  return { campaign, preview };
}

export async function scheduleBroadcastCampaign({
  businessId,
  actorId,
  campaignId,
}: {
  businessId: string;
  actorId: string;
  campaignId: string;
}) {
  const campaign = await prisma.broadcastCampaign.findFirstOrThrow({
    where: { id: campaignId, businessId },
  });

  if (!schedulableStatuses.includes(campaign.status)) {
    throw new Error("Only draft or paused campaigns can be scheduled.");
  }

  const updated = await prisma.broadcastCampaign.update({
    where: { id: campaign.id },
    data: { status: BroadcastStatus.SCHEDULED },
  });

  await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: "broadcast_campaign_scheduled",
      entityType: "BroadcastCampaign",
      entityId: campaign.id,
      afterState: { scheduledAt: updated.scheduledAt },
    },
  });

  await enqueueBroadcastCampaign(updated.id, updated.scheduledAt);
  return updated;
}

export async function pauseBroadcastCampaign({
  businessId,
  actorId,
  campaignId,
}: {
  businessId: string;
  actorId: string;
  campaignId: string;
}) {
  const campaign = await prisma.broadcastCampaign.findFirstOrThrow({
    where: { id: campaignId, businessId },
  });

  if (!pausableStatuses.includes(campaign.status)) {
    throw new Error("Only scheduled or running campaigns can be paused.");
  }

  const updated = await prisma.broadcastCampaign.update({
    where: { id: campaign.id },
    data: { status: BroadcastStatus.PAUSED },
  });

  await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: "broadcast_campaign_paused",
      entityType: "BroadcastCampaign",
      entityId: campaign.id,
    },
  });

  return updated;
}

export async function cancelBroadcastCampaign({
  businessId,
  actorId,
  campaignId,
}: {
  businessId: string;
  actorId: string;
  campaignId: string;
}) {
  const campaign = await prisma.broadcastCampaign.findFirstOrThrow({
    where: { id: campaignId, businessId },
  });

  if (
    !cancellableStatuses.includes(campaign.status)
  ) {
    throw new Error("This campaign can no longer be cancelled.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextCampaign = await tx.broadcastCampaign.update({
      where: { id: campaign.id },
      data: { status: BroadcastStatus.CANCELLED, completedAt: new Date() },
    });

    await tx.broadcastRecipient.updateMany({
      where: {
        campaignId: campaign.id,
        status: BroadcastRecipientStatus.PENDING,
      },
      data: {
        status: BroadcastRecipientStatus.SKIPPED,
        failureReason: "Campaign cancelled before send.",
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        actorId,
        action: "broadcast_campaign_cancelled",
        entityType: "BroadcastCampaign",
        entityId: campaign.id,
      },
    });

    return nextCampaign;
  });

  return updated;
}

export async function sendTestBroadcast({
  businessId,
  actorId,
  templateId,
  phoneNumber,
  customerName,
}: {
  businessId: string;
  actorId: string;
  templateId: string;
  phoneNumber: string;
  customerName: string;
}) {
  const template = await prisma.whatsAppTemplate.findFirstOrThrow({
    where: { id: templateId, businessId, status: TemplateStatus.APPROVED },
  });
  const body = renderTemplateBody(extractTemplateBody(template.components), {
    customerName,
  });

  const audit = await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: "broadcast_test_sent",
      entityType: "WhatsAppTemplate",
      entityId: template.id,
      afterState: {
        phoneNumber: normalizePhoneNumber(phoneNumber),
        templateName: template.name,
        templateLanguage: template.language,
        body,
      },
    },
  });

  return audit;
}

async function findOrCreateBroadcastConversation({
  businessId,
  customerId,
}: {
  businessId: string;
  customerId: string;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      businessId,
      customerId,
      status: {
        in: [
          ConversationStatus.OPEN,
          ConversationStatus.WAITING_FOR_CUSTOMER,
          ConversationStatus.WAITING_FOR_OWNER,
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      businessId,
      customerId,
      channel: ConversationChannel.WHATSAPP,
      status: ConversationStatus.WAITING_FOR_CUSTOMER,
      botEnabled: true,
      serviceWindowExpiresAt: null,
    },
  });
}

export async function executeBroadcastCampaign(campaignId: string) {
  const campaign = await prisma.broadcastCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      template: true,
      recipients: {
        where: { status: BroadcastRecipientStatus.PENDING },
        include: { customer: true },
        orderBy: { createdAt: "asc" },
        take: 250,
      },
    },
  });

  if (
    !executableStatuses.includes(campaign.status)
  ) {
    return { skipped: true, reason: `Campaign is ${campaign.status}.` };
  }

  await prisma.broadcastCampaign.update({
    where: { id: campaign.id },
    data: {
      status: BroadcastStatus.RUNNING,
      startedAt: campaign.startedAt ?? new Date(),
    },
  });

  const templateBody = extractTemplateBody(campaign.template.components);
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of campaign.recipients) {
    const latestCampaign = await prisma.broadcastCampaign.findUniqueOrThrow({
      where: { id: campaign.id },
      select: { status: true },
    });

    if (latestCampaign.status === BroadcastStatus.PAUSED) {
      return { paused: true, sentCount, failedCount };
    }

    if (latestCampaign.status === BroadcastStatus.CANCELLED) {
      return { cancelled: true, sentCount, failedCount };
    }

    try {
      const variables = jsonObject(recipient.personalizedVariables) as Record<
        string,
        string
      >;
      const conversation = await findOrCreateBroadcastConversation({
        businessId: campaign.businessId,
        customerId: recipient.customerId,
      });
      const body = renderTemplateBody(templateBody, variables);
      const provider = await sendWhatsAppTemplate({
        to: recipient.customer.normalizedPhoneNumber,
        name: campaign.template.name,
        language: campaign.template.language,
        variables: Object.values(variables),
      });
      const providerMessageId = provider.providerMessageId;

      await prisma.$transaction(async (tx) => {
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            providerMessageId,
            direction: MessageDirection.OUTBOUND,
            senderType: MessageSenderType.BOT,
            messageType: MessageType.TEMPLATE,
            body,
            templateName: campaign.template.name,
            templateLanguage: campaign.template.language,
            status: MessageStatus.SENT,
            sentAt: new Date(),
            rawPayload: {
              campaignId: campaign.id,
              recipientId: recipient.id,
              templateVariables: variables,
              providerResponse: provider.rawResponse,
            } as Prisma.InputJsonValue,
          },
        });

        await tx.broadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            conversationId: conversation.id,
            status: BroadcastRecipientStatus.SENT,
            providerMessageId,
            sentAt: new Date(),
          },
        });

        await tx.customer.update({
          where: { id: recipient.customerId },
          data: { lastContactAt: new Date() },
        });
      });

      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: BroadcastRecipientStatus.FAILED,
          failureReason:
            error instanceof Error ? error.message : "Unknown broadcast send failure.",
        },
      });
    }
  }

  const remaining = await prisma.broadcastRecipient.count({
    where: { campaignId: campaign.id, status: BroadcastRecipientStatus.PENDING },
  });
  const aggregate = await prisma.broadcastRecipient.groupBy({
    by: ["status"],
    where: { campaignId: campaign.id },
    _count: true,
  });
  const countByStatus = new Map(
    aggregate.map((item) => [item.status, item._count]),
  );

  await prisma.broadcastCampaign.update({
    where: { id: campaign.id },
    data: {
      status: remaining === 0 ? BroadcastStatus.COMPLETED : BroadcastStatus.RUNNING,
      completedAt: remaining === 0 ? new Date() : null,
      sentCount: countByStatus.get(BroadcastRecipientStatus.SENT) ?? 0,
      deliveredCount: countByStatus.get(BroadcastRecipientStatus.DELIVERED) ?? 0,
      readCount: countByStatus.get(BroadcastRecipientStatus.READ) ?? 0,
      failedCount:
        (countByStatus.get(BroadcastRecipientStatus.FAILED) ?? 0) +
        (countByStatus.get(BroadcastRecipientStatus.SKIPPED) ?? 0),
    },
  });

  if (remaining > 0) {
    await enqueueBroadcastCampaign(campaign.id);
  }

  return { sentCount, failedCount, remaining };
}

export async function updateBroadcastDeliveryStatus({
  providerMessageId,
  status,
  errorMessage,
  timestamp,
}: {
  providerMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  errorMessage?: string;
  timestamp?: string;
}) {
  const recipient = await prisma.broadcastRecipient.findFirst({
    where: { providerMessageId },
    include: { campaign: true },
  });

  if (!recipient) return null;

  const statusTimestamp = timestamp ? new Date(Number(timestamp) * 1000) : new Date();
  const nextStatus =
    status === "sent"
      ? BroadcastRecipientStatus.SENT
      : status === "delivered"
        ? BroadcastRecipientStatus.DELIVERED
        : status === "read"
          ? BroadcastRecipientStatus.READ
          : BroadcastRecipientStatus.FAILED;

  const updated = await prisma.broadcastRecipient.update({
    where: { id: recipient.id },
    data: {
      status: nextStatus,
      deliveredAt: status === "delivered" ? statusTimestamp : recipient.deliveredAt,
      readAt: status === "read" ? statusTimestamp : recipient.readAt,
      failureReason: status === "failed" ? errorMessage : recipient.failureReason,
    },
  });

  const aggregate = await prisma.broadcastRecipient.groupBy({
    by: ["status"],
    where: { campaignId: recipient.campaignId },
    _count: true,
  });
  const countByStatus = new Map(
    aggregate.map((item) => [item.status, item._count]),
  );

  await prisma.broadcastCampaign.update({
    where: { id: recipient.campaignId },
    data: {
      sentCount: countByStatus.get(BroadcastRecipientStatus.SENT) ?? 0,
      deliveredCount: countByStatus.get(BroadcastRecipientStatus.DELIVERED) ?? 0,
      readCount: countByStatus.get(BroadcastRecipientStatus.READ) ?? 0,
      failedCount: countByStatus.get(BroadcastRecipientStatus.FAILED) ?? 0,
    },
  });

  return updated;
}
