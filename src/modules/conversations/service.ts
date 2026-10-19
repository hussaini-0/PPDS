import {
  ConversationChannel,
  ConversationStatus,
  LeadStage,
  MessageDirection,
  MessageSenderType,
  MessageStatus,
  MessageType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/phone";
import { cancelPendingFollowUps } from "@/modules/follow-ups/service";
import { validateOutboundMessageWindow } from "@/modules/whatsapp/service-window";
import {
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "@/modules/whatsapp/client";

export async function listRecentConversations(businessId: string) {
  return prisma.conversation.findMany({
    where: { businessId },
    include: {
      customer: true,
      lead: true,
      botState: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
      attentionItems: {
        where: { status: "OPEN" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });
}

export async function getConversationDetail(businessId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, businessId },
    include: {
      customer: true,
      lead: true,
      botState: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
      attentionItems: {
        where: { status: "OPEN" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function findOrCreateConversationContext({
  businessId,
  phoneNumber,
  customerName,
  referralMetadata,
}: {
  businessId: string;
  phoneNumber: string;
  customerName?: string;
  referralMetadata?: Record<string, unknown>;
}) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  let customer = await prisma.customer.findUnique({
    where: {
      businessId_normalizedPhoneNumber: {
        businessId,
        normalizedPhoneNumber,
      },
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        businessId,
        fullName: customerName?.trim() || "WhatsApp Lead",
        phoneNumber,
        normalizedPhoneNumber,
        source: "WHATSAPP",
        marketingOptIn: false,
      },
    });
  }

  let lead = await prisma.lead.findFirst({
    where: {
      businessId,
      customerId: customer.id,
      stage: {
        notIn: [LeadStage.CONVERTED, LeadStage.LOST, LeadStage.NOT_INTERESTED],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        businessId,
        customerId: customer.id,
        stage: LeadStage.NEW,
        source: "WHATSAPP",
        referralMetadata: referralMetadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId,
      customerId: customer.id,
      status: {
        in: [ConversationStatus.OPEN, ConversationStatus.WAITING_FOR_CUSTOMER, ConversationStatus.WAITING_FOR_OWNER],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        businessId,
        customerId: customer.id,
        leadId: lead.id,
        channel: ConversationChannel.WHATSAPP,
        status: ConversationStatus.OPEN,
        serviceWindowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  return { customer, lead, conversation };
}

export async function recordInboundMessage({
  conversationId,
  providerMessageId,
  messageType,
  body,
  mediaUrl,
  mediaMimeType,
  rawPayload,
}: {
  conversationId: string;
  providerMessageId?: string;
  messageType: MessageType;
  body?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  rawPayload?: Record<string, unknown>;
}) {
  return prisma.message.upsert({
    where: {
      conversationId_providerMessageId: {
        conversationId,
        providerMessageId: providerMessageId ?? "__missing__",
      },
    },
    update: {},
    create: {
      conversationId,
      providerMessageId,
      direction: MessageDirection.INBOUND,
      senderType: MessageSenderType.CUSTOMER,
      messageType,
      body,
      mediaUrl,
      mediaMimeType,
      status: MessageStatus.READ,
      readAt: new Date(),
      rawPayload: rawPayload as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function syncInboundActivity({
  customerId,
  leadId,
  conversationId,
}: {
  customerId: string;
  leadId: string;
  conversationId: string;
}) {
  const now = new Date();

  await prisma.customer.update({
    where: { id: customerId },
    data: { lastContactAt: now },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastInboundMessageAt: now,
    },
  });

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: { stage: true },
  });

  if (lead.stage === LeadStage.NEW) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: LeadStage.BOT_ENGAGED },
    });
  }

  await cancelPendingFollowUps({
    leadId,
    reason: "Customer replied after follow-up was scheduled.",
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: ConversationStatus.WAITING_FOR_OWNER,
      unreadCount: { increment: 1 },
      lastMessageAt: now,
      serviceWindowExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });
}

export async function sendManualMessage({
  businessId,
  conversationId,
  actorId,
  body,
  templateName,
}: {
  businessId: string;
  conversationId: string;
  actorId: string;
  body: string;
  templateName?: string;
}) {
  const conversation = await prisma.conversation.findFirstOrThrow({
    where: { id: conversationId, businessId },
    include: { customer: { select: { normalizedPhoneNumber: true } } },
  });

  const serviceWindow = validateOutboundMessageWindow({
    serviceWindowExpiresAt: conversation.serviceWindowExpiresAt,
    isTemplateMessage: Boolean(templateName),
  });

  if (!serviceWindow.allowed) {
    throw new Error(serviceWindow.reason);
  }

  const provider = templateName
    ? await sendWhatsAppTemplate({
        to: conversation.customer.normalizedPhoneNumber,
        name: templateName,
        language: "en",
      })
    : await sendWhatsAppText(conversation.customer.normalizedPhoneNumber, body);

  const message = await prisma.message.create({
    data: {
      conversationId,
      providerMessageId: provider.providerMessageId,
      direction: MessageDirection.OUTBOUND,
      senderType: MessageSenderType.OWNER,
      messageType: templateName ? MessageType.TEMPLATE : MessageType.TEXT,
      body,
      templateName,
      status: MessageStatus.SENT,
      sentAt: new Date(),
      rawPayload: provider.rawResponse as Prisma.InputJsonValue,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      humanTakeover: true,
      botEnabled: false,
      status: ConversationStatus.WAITING_FOR_CUSTOMER,
      lastMessageAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: "manual_message_sent",
      entityType: "Conversation",
      entityId: conversationId,
      afterState: { body, templateName },
    },
  });

  return message;
}

export async function setHumanTakeover({
  businessId,
  conversationId,
  actorId,
  humanTakeover,
}: {
  businessId: string;
  conversationId: string;
  actorId: string;
  humanTakeover: boolean;
}) {
  const conversation = await prisma.conversation.update({
    where: { id: conversationId, businessId },
    data: {
      humanTakeover,
      botEnabled: !humanTakeover,
      status: humanTakeover
        ? ConversationStatus.WAITING_FOR_OWNER
        : ConversationStatus.WAITING_FOR_CUSTOMER,
    },
  });

  await prisma.auditLog.create({
    data: {
      businessId,
      actorId,
      action: humanTakeover ? "human_takeover_enabled" : "human_takeover_disabled",
      entityType: "Conversation",
      entityId: conversationId,
      afterState: { humanTakeover },
    },
  });

  return conversation;
}

export async function updateMessageDeliveryStatus({
  providerMessageId,
  status,
  errorCode,
  errorMessage,
  timestamp,
}: {
  providerMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  errorCode?: string;
  errorMessage?: string;
  timestamp?: string;
}) {
  const message = await prisma.message.findFirst({
    where: { providerMessageId },
  });

  if (!message) {
    return null;
  }

  const statusTimestamp = timestamp ? new Date(Number(timestamp) * 1000) : new Date();

  return prisma.message.update({
    where: { id: message.id },
    data: {
      status:
        status === "sent"
          ? MessageStatus.SENT
          : status === "delivered"
            ? MessageStatus.DELIVERED
            : status === "read"
              ? MessageStatus.READ
              : MessageStatus.FAILED,
      sentAt: status === "sent" ? statusTimestamp : message.sentAt,
      deliveredAt: status === "delivered" ? statusTimestamp : message.deliveredAt,
      readAt: status === "read" ? statusTimestamp : message.readAt,
      failedAt: status === "failed" ? statusTimestamp : message.failedAt,
      errorCode,
      errorMessage,
    },
  });
}
