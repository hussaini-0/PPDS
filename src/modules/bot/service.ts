import {
  BotStatus,
  LeadStage,
  MessageDirection,
  MessageSenderType,
  MessageStatus,
  MessageType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { findPublishedCmsBotAnswer } from "@/modules/cms/service";
import { sendWhatsAppText } from "@/modules/whatsapp/client";
import {
  cancelPendingFollowUps,
  scheduleLeadFollowUp,
} from "@/modules/follow-ups/service";
import { calculateQualificationScore } from "@/modules/leads/logic";
import { createPaymentProofReviewItem } from "@/modules/payments/service";
import { getPaymentSettings } from "@/modules/settings/service";

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel messages"];
const INTEREST_KEYWORDS = ["pay", "payment", "interested", "yes", "subscribe", "join"];
const PRICE_OBJECTION_KEYWORDS = ["price", "expensive", "cost", "discount"];
const HUMAN_ESCALATION_KEYWORDS = [
  "human",
  "owner",
  "agent",
  "complaint",
  "refund",
  "cancel subscription",
  "custom price",
  "exception",
];

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isOptOut(text: string) {
  return OPT_OUT_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isInterested(text: string) {
  return INTEREST_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isPriceObjection(text: string) {
  return PRICE_OBJECTION_KEYWORDS.some((keyword) => text.includes(keyword));
}

function requiresHumanEscalation(text: string) {
  return HUMAN_ESCALATION_KEYWORDS.some((keyword) => text.includes(keyword));
}

function buildQuestionPrompt(question: { prompt: string; isRequired: boolean }) {
  return `${question.prompt}${question.isRequired ? "" : " (optional)"}`;
}

function inferPlanFromAnswers(
  plans: Array<{
    id: string;
    price: Prisma.Decimal;
    recommendationPriority: number;
    isActive: boolean;
    name: string;
    billingInterval: string;
    description: string | null;
  }>,
  answers: Record<string, string>,
) {
  const budget = Number(answers.budget ?? 0);

  const budgetMatched =
    plans
      .filter((plan) => plan.isActive)
      .sort((a, b) => Number(a.price) - Number(b.price))
      .find((plan) => budget > 0 && Number(plan.price) <= budget) ?? null;

  return (
    budgetMatched ??
    plans
      .filter((plan) => plan.isActive)
      .sort((a, b) => b.recommendationPriority - a.recommendationPriority)[0] ??
    null
  );
}

function inferLeadTemperature(score: number) {
  if (score >= 7) return "HOT";
  if (score >= 4) return "WARM";
  return "COLD";
}

async function sendBotMessage(conversationId: string, body: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { customer: { select: { normalizedPhoneNumber: true } } },
  });
  const provider = await sendWhatsAppText(
    conversation.customer.normalizedPhoneNumber,
    body,
  );

  return prisma.message.create({
    data: {
      conversationId,
      providerMessageId: provider.providerMessageId,
      direction: MessageDirection.OUTBOUND,
      senderType: MessageSenderType.BOT,
      messageType: MessageType.TEXT,
      body,
      status: MessageStatus.SENT,
      sentAt: new Date(),
      rawPayload: provider.rawResponse as Prisma.InputJsonValue,
    },
  });
}

async function acknowledgeOptOut({
  businessId,
  customerId,
  conversationId,
  leadId,
}: {
  businessId: string;
  customerId: string;
  conversationId: string;
  leadId: string;
}) {
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      marketingOptIn: false,
      marketingOptOutAt: new Date(),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { botEnabled: false },
  });

  await cancelPendingFollowUps({
    leadId,
    reason: "Customer opted out.",
  });

  await prisma.ownerAttentionItem.create({
    data: {
      businessId,
      customerId,
      conversationId,
      priority: "MEDIUM",
      reason: "Customer opted out of marketing messages",
      recommendedAction: "Do not include this customer in future broadcasts.",
    },
  });

  await sendBotMessage(
    conversationId,
    "You have been opted out of marketing messages. Transactional subscription updates can still be sent when required.",
  );
}

async function escalateToOwner({
  businessId,
  customerId,
  leadId,
  conversationId,
  reason,
}: {
  businessId: string;
  customerId: string;
  leadId: string;
  conversationId: string;
  reason: string;
}) {
  await cancelPendingFollowUps({ leadId, reason });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      botStatus: BotStatus.ESCALATED,
      humanAttentionRequired: true,
      humanAttentionReason: reason,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      botEnabled: false,
      humanTakeover: true,
      status: "WAITING_FOR_OWNER",
      complaintState: reason.toLowerCase().includes("complaint"),
    },
  });

  await prisma.ownerAttentionItem.create({
    data: {
      businessId,
      customerId,
      leadId,
      conversationId,
      priority: "URGENT",
      reason,
      recommendedAction: "Owner should review the conversation and respond manually.",
    },
  });

  await sendBotMessage(
    conversationId,
    "I am flagging this for the owner so they can review it personally.",
  );
}

export async function runBotForInboundMessage({
  businessId,
  conversationId,
  leadId,
  customerId,
  inboundMessageId,
}: {
  businessId: string;
  conversationId: string;
  leadId: string;
  customerId: string;
  inboundMessageId: string;
}) {
  const [conversation, lead, inboundMessage, botState, questions, plans, paymentSettings] =
    await Promise.all([
      prisma.conversation.findUniqueOrThrow({
        where: { id: conversationId },
      }),
      prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
      }),
      prisma.message.findUniqueOrThrow({
        where: { id: inboundMessageId },
      }),
      prisma.botConversationState.findUnique({
        where: { conversationId },
      }),
      prisma.qualificationQuestion.findMany({
        where: { businessId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.subscriptionPlan.findMany({
        where: { businessId, isActive: true },
        orderBy: [{ recommendationPriority: "desc" }, { price: "asc" }],
      }),
      getPaymentSettings(businessId),
    ]);

  if (
    conversation.humanTakeover ||
    !conversation.botEnabled ||
    lead.botStatus === BotStatus.PAUSED
  ) {
    return { handled: false, reason: "Bot is paused for this conversation." };
  }

  const text = normalizeText(inboundMessage.body);

  if (text && isOptOut(text)) {
    await acknowledgeOptOut({ businessId, customerId, leadId, conversationId });
    return { handled: true, reason: "Opt-out handled." };
  }

  if (text && requiresHumanEscalation(text)) {
    await escalateToOwner({
      businessId,
      customerId,
      leadId,
      conversationId,
      reason: "Customer requested owner attention or raised a sensitive issue",
    });

    return { handled: true, reason: "Escalated to owner." };
  }

  if (
    (inboundMessage.messageType === MessageType.IMAGE ||
      inboundMessage.messageType === MessageType.DOCUMENT) &&
    (lead.stage === LeadStage.PAYMENT_INSTRUCTIONS_SENT ||
      lead.stage === LeadStage.PAYMENT_PROOF_RECEIVED)
  ) {
    const amount = lead.selectedPlanId
      ? Number(
          (
            await prisma.subscriptionPlan.findUnique({
              where: { id: lead.selectedPlanId },
              select: { price: true },
            })
          )?.price ?? 0,
        )
      : 0;

    await createPaymentProofReviewItem({
      businessId,
      customerId,
      leadId,
      conversationId,
      amount,
      currency: "PKR",
      paymentMethod: paymentSettings.methods[0] ?? "Bank transfer",
      proofFile: {
        mediaUrl: inboundMessage.mediaUrl ?? undefined,
        mimeType: inboundMessage.mediaMimeType ?? undefined,
        originalName:
          inboundMessage.messageType === MessageType.IMAGE
            ? "payment-proof.jpg"
            : "payment-proof.pdf",
        messageType: inboundMessage.messageType,
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: LeadStage.PAYMENT_PROOF_RECEIVED,
        humanAttentionRequired: true,
        humanAttentionReason: "Payment proof received and awaiting review",
      },
    });

    await cancelPendingFollowUps({
      leadId,
      reason: "Payment proof received.",
    });

    await sendBotMessage(
      conversationId,
      "Payment proof received. The owner will verify it before activating your subscription.",
    );

    return { handled: true, reason: "Payment proof acknowledged." };
  }

  if (text) {
    const cmsAnswer = await findPublishedCmsBotAnswer(businessId, text);

    if (cmsAnswer) {
      await sendBotMessage(conversationId, cmsAnswer);
      return { handled: true, reason: "Answered from published CMS content." };
    }
  }

  if (!botState) {
    const firstQuestion = questions[0];

    if (!firstQuestion) {
      await escalateToOwner({
        businessId,
        customerId,
        leadId,
        conversationId,
        reason: "No active qualification questions are configured",
      });

      return {
        handled: true,
        reason: "Escalated because qualification is not configured.",
      };
    }

    await prisma.botConversationState.create({
      data: {
        conversationId,
        currentStep: "qualification:0",
        collectedData: { answers: {} },
        confidence: new Prisma.Decimal(1),
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: LeadStage.QUALIFYING,
        botStatus: BotStatus.ACTIVE,
      },
    });

    await sendBotMessage(
      conversationId,
      `Thanks for contacting us on WhatsApp. I’ll ask a few short questions so I can recommend the right plan.\n\n${buildQuestionPrompt(firstQuestion)}`,
    );

    await scheduleLeadFollowUp({
      businessId,
      leadId,
      conversationId,
      triggerType: "QUALIFICATION_NO_REPLY",
      expectedStage: LeadStage.QUALIFYING,
    });

    return { handled: true, reason: "Started qualification flow." };
  }

  if (botState.currentStep.startsWith("qualification:")) {
    const index = Number(botState.currentStep.split(":")[1] ?? 0);
    const currentQuestion = questions[index];
    const nextQuestion = questions[index + 1];
    const previousData =
      (botState.collectedData as {
        answersByQuestionId?: Record<string, string>;
        answersByLabel?: Record<string, string>;
      }) ?? {};
    const answers = {
      ...(previousData.answersByQuestionId ?? {}),
      [currentQuestion.id]: inboundMessage.body ?? "",
    };
    const answersByLabel = {
      ...(previousData.answersByLabel ?? {}),
      [currentQuestion.label]: inboundMessage.body ?? "",
    };

    if (nextQuestion) {
      await prisma.botConversationState.update({
        where: { conversationId },
        data: {
          currentStep: `qualification:${index + 1}`,
          collectedData: { answersByQuestionId: answers, answersByLabel },
        },
      });

      await sendBotMessage(conversationId, buildQuestionPrompt(nextQuestion));
      await scheduleLeadFollowUp({
        businessId,
        leadId,
        conversationId,
        triggerType: "QUALIFICATION_NO_REPLY",
        expectedStage: LeadStage.QUALIFYING,
      });

      return { handled: true, reason: "Advanced to next qualification question." };
    }

    const qualificationScore = calculateQualificationScore(
      questions.map((question) => ({
        id: question.id,
        qualificationWeight: question.qualificationWeight,
      })),
      Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      })),
    );

    const selectedPlan = inferPlanFromAnswers(plans, answersByLabel);

    await prisma.botConversationState.update({
        where: { conversationId },
        data: {
          currentStep: "awaiting_interest",
          collectedData: {
            answersByQuestionId: answers,
            answersByLabel,
            qualificationScore,
          },
          recommendedPlanId: selectedPlan?.id ?? null,
        },
      });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: LeadStage.PLAN_RECOMMENDED,
        intentScore: qualificationScore * 10,
        leadTemperature: inferLeadTemperature(qualificationScore),
        selectedPlanId: selectedPlan?.id ?? null,
        structuredData: {
          answersByQuestionId: answers,
          answersByLabel,
          qualificationScore,
        },
      },
    });

    if (!selectedPlan) {
      await prisma.ownerAttentionItem.create({
        data: {
          businessId,
          customerId,
          leadId,
          conversationId,
          priority: "HIGH",
          reason: "Bot could not match an active plan to the customer answers",
          recommendedAction: "Review qualification answers and recommend a plan manually.",
        },
      });

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          botStatus: BotStatus.ESCALATED,
          humanAttentionRequired: true,
          humanAttentionReason: "No active plan matched qualification answers",
        },
      });

      await sendBotMessage(
        conversationId,
        "I need the owner to review your requirements before recommending a plan.",
      );

      return { handled: true, reason: "Escalated because no plan matched." };
    }

    await sendBotMessage(
      conversationId,
      `Based on your answers, the best fit is ${selectedPlan.name} at PKR ${Number(selectedPlan.price).toLocaleString("en-PK")} (${selectedPlan.billingInterval.toLowerCase()}). ${selectedPlan.description ?? ""} If you want to proceed, reply with "pay" and I’ll send the payment instructions.`,
    );

    await scheduleLeadFollowUp({
      businessId,
      leadId,
      conversationId,
      triggerType: "PLAN_RECOMMENDED_NO_REPLY",
      expectedStage: LeadStage.PLAN_RECOMMENDED,
    });

    return { handled: true, reason: "Plan recommended." };
  }

  if (botState.currentStep === "awaiting_interest") {
    if (isInterested(text)) {
      await prisma.botConversationState.update({
        where: { conversationId },
        data: { currentStep: "awaiting_payment_proof" },
      });

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          stage: LeadStage.PAYMENT_INSTRUCTIONS_SENT,
          lastOutboundMessageAt: new Date(),
        },
      });

      await sendBotMessage(conversationId, paymentSettings.instructions);
      await scheduleLeadFollowUp({
        businessId,
        leadId,
        conversationId,
        triggerType: "PAYMENT_PROOF_MISSING",
        expectedStage: LeadStage.PAYMENT_INSTRUCTIONS_SENT,
      });

      return { handled: true, reason: "Payment instructions sent." };
    }

    if (isPriceObjection(text)) {
      const pricingEntry = await prisma.knowledgeBaseEntry.findFirst({
        where: {
          businessId,
          category: "PRICING",
          status: "APPROVED",
        },
      });

      await sendBotMessage(
        conversationId,
        pricingEntry?.content ??
          "The bot cannot change approved prices. If you need an exception, the owner must review it manually.",
      );

      await prisma.ownerAttentionItem.create({
        data: {
          businessId,
          customerId,
          leadId,
          conversationId,
          priority: "HIGH",
          reason: "Customer raised a pricing objection after plan recommendation",
          recommendedAction: "Review objection and decide whether manual intervention is needed.",
        },
      });

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          humanAttentionRequired: true,
          humanAttentionReason: "Pricing objection after plan recommendation",
        },
      });

      return { handled: true, reason: "Pricing objection handled." };
    }

    await sendBotMessage(
      conversationId,
      'If you want to proceed, reply with "pay". If you still have concerns, tell me what is blocking you and I will either answer from approved information or flag the owner.',
    );

    return { handled: true, reason: "Fallback clarification sent." };
  }

  if (botState.currentStep === "awaiting_payment_proof") {
    await sendBotMessage(
      conversationId,
      "Please send the payment proof as an image or document in this chat so it can be reviewed.",
    );

    return { handled: true, reason: "Reminded customer to send payment proof." };
  }

  return { handled: false, reason: "No matching bot step." };
}
