import {
  FollowUpJobStatus,
  LeadStage,
  MessageDirection,
  MessageSenderType,
  MessageStatus,
  MessageType,
  Prisma,
} from "@prisma/client";
import { addMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/modules/whatsapp/client";
import { getFollowUpQueue } from "@/server/jobs/queues";
import {
  buildFollowUpMessage,
  evaluateFollowUpEligibility,
  getDefaultFollowUpDelayMinutes,
} from "@/modules/follow-ups/logic";

type FollowUpTriggerType =
  | "QUALIFICATION_NO_REPLY"
  | "PLAN_RECOMMENDED_NO_REPLY"
  | "PAYMENT_PROOF_MISSING";

const MAX_FOLLOW_UPS_PER_LEAD = 3;

async function enqueueFollowUp(jobId: string, scheduledFor: Date) {
  const delay = Math.max(0, scheduledFor.getTime() - Date.now());

  try {
    await getFollowUpQueue().add(
      "execute-follow-up",
      { followUpJobId: jobId },
      {
        delay,
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  } catch {
    // The persisted database job is authoritative; Redis can be unavailable in local mock mode.
  }
}

async function getOrCreateAutomationRule({
  businessId,
  triggerType,
  expectedStage,
}: {
  businessId: string;
  triggerType: FollowUpTriggerType;
  expectedStage: LeadStage;
}) {
  const existing = await prisma.automationRule.findFirst({
    where: { businessId, triggerType, isActive: true },
  });

  if (existing) return existing;

  const delayMinutes = getDefaultFollowUpDelayMinutes(triggerType);

  return prisma.automationRule.create({
    data: {
      businessId,
      name: triggerType
        .toLowerCase()
        .split("_")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
      triggerType,
      conditions: { expectedStage, maxFollowUps: MAX_FOLLOW_UPS_PER_LEAD },
      actions: { message: buildFollowUpMessage(triggerType) },
      delayMinutes,
      isActive: true,
    },
  });
}

export async function scheduleLeadFollowUp({
  businessId,
  leadId,
  conversationId,
  triggerType,
  expectedStage,
}: {
  businessId: string;
  leadId: string;
  conversationId: string;
  triggerType: FollowUpTriggerType;
  expectedStage: LeadStage;
}) {
  const existing = await prisma.followUpJob.findFirst({
    where: {
      businessId,
      leadId,
      conversationId,
      status: FollowUpJobStatus.SCHEDULED,
      automationRule: { triggerType },
    },
  });

  if (existing) return existing;

  const rule = await getOrCreateAutomationRule({
    businessId,
    triggerType,
    expectedStage,
  });
  const scheduledFor = addMinutes(new Date(), rule.delayMinutes);

  const job = await prisma.followUpJob.create({
    data: {
      businessId,
      leadId,
      conversationId,
      automationRuleId: rule.id,
      scheduledFor,
      status: FollowUpJobStatus.SCHEDULED,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: scheduledFor },
  });

  await enqueueFollowUp(job.id, scheduledFor);

  return job;
}

export async function cancelPendingFollowUps({
  leadId,
  reason,
}: {
  leadId: string;
  reason: string;
}) {
  await prisma.followUpJob.updateMany({
    where: {
      leadId,
      status: FollowUpJobStatus.SCHEDULED,
    },
    data: {
      status: FollowUpJobStatus.CANCELLED,
      cancellationReason: reason,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: null },
  });
}

export async function executeFollowUpJob(followUpJobId: string) {
  const job = await prisma.followUpJob.findUniqueOrThrow({
    where: { id: followUpJobId },
    include: {
      automationRule: true,
      lead: {
        include: {
          customer: true,
        },
      },
      conversation: {
        include: {
          botState: true,
        },
      },
    },
  });

  if (job.status !== FollowUpJobStatus.SCHEDULED) {
    return { executed: false, reason: "Follow-up is not scheduled." };
  }

  const conditions = (job.automationRule?.conditions ?? {}) as {
    expectedStage?: LeadStage;
    maxFollowUps?: number;
    requiresTemplate?: boolean;
    templateName?: string;
  };
  const expectedStage = conditions.expectedStage ?? job.lead.stage;
  const requiresTemplate = conditions.requiresTemplate ?? false;
  const templateAvailable = requiresTemplate
    ? Boolean(
        await prisma.whatsAppTemplate.findFirst({
          where: {
            businessId: job.businessId,
            name: conditions.templateName,
            status: "APPROVED",
          },
        }),
      )
    : true;

  const eligibility = evaluateFollowUpEligibility({
    leadStage: job.lead.stage,
    expectedStage,
    convertedAt: job.lead.convertedAt,
    lostAt: job.lead.lostAt,
    marketingOptIn: job.lead.customer.marketingOptIn,
    marketingOptOutAt: job.lead.customer.marketingOptOutAt,
    humanTakeover: job.conversation.humanTakeover,
    complaintState: job.conversation.complaintState,
    lastInboundMessageAt: job.lead.lastInboundMessageAt,
    scheduledAt: job.createdAt,
    serviceWindowExpiresAt: job.conversation.serviceWindowExpiresAt,
    requiresTemplate,
    templateAvailable,
    followUpCount: job.conversation.botState?.followUpCount ?? 0,
    maxFollowUps: conditions.maxFollowUps ?? MAX_FOLLOW_UPS_PER_LEAD,
  });

  if (!eligibility.eligible) {
    await prisma.followUpJob.update({
      where: { id: job.id },
      data: {
        status: FollowUpJobStatus.CANCELLED,
        cancellationReason: eligibility.reason,
      },
    });

    return { executed: false, reason: eligibility.reason };
  }

  const message =
    ((job.automationRule?.actions ?? {}) as { message?: string }).message ??
    buildFollowUpMessage(job.automationRule?.triggerType ?? "DEFAULT");
  const provider = await sendWhatsAppText(
    job.lead.customer.normalizedPhoneNumber,
    message,
  );

  await prisma.$transaction([
    prisma.followUpJob.update({
      where: { id: job.id },
      data: {
        status: FollowUpJobStatus.EXECUTED,
        executedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    }),
    prisma.message.create({
      data: {
        conversationId: job.conversationId,
        providerMessageId: provider.providerMessageId,
        direction: MessageDirection.OUTBOUND,
        senderType: MessageSenderType.BOT,
        messageType: MessageType.TEXT,
        body: message,
        status: MessageStatus.SENT,
        sentAt: new Date(),
        rawPayload: provider.rawResponse as Prisma.InputJsonValue,
      },
    }),
    prisma.botConversationState.upsert({
      where: { conversationId: job.conversationId },
      update: { followUpCount: { increment: 1 } },
      create: {
        conversationId: job.conversationId,
        currentStep: "follow_up_sent",
        collectedData: Prisma.JsonNull,
        confidence: new Prisma.Decimal(1),
        followUpCount: 1,
      },
    }),
    prisma.lead.update({
      where: { id: job.leadId },
      data: {
        stage:
          job.lead.stage === LeadStage.PAYMENT_INSTRUCTIONS_SENT
            ? LeadStage.PAYMENT_INSTRUCTIONS_SENT
            : LeadStage.FOLLOW_UP_REQUIRED,
        lastOutboundMessageAt: new Date(),
        nextFollowUpAt: null,
      },
    }),
  ]);

  return { executed: true, reason: "Follow-up sent." };
}
