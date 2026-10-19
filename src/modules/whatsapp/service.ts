import { MessageType, WebhookProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { findOrCreateConversationContext, recordInboundMessage, syncInboundActivity, updateMessageDeliveryStatus } from "@/modules/conversations/service";
import { runBotForInboundMessage } from "@/modules/bot/service";
import { assertMockMode } from "@/modules/integrations/mode";
import { updateBroadcastDeliveryStatus } from "@/modules/broadcasts/service";
import { markWebhookFailed, markWebhookProcessed, persistWebhookEvent } from "@/modules/webhooks/service";
import {
  type MockIncomingMessageInput,
  whatsappWebhookSchema,
} from "@/modules/whatsapp/schemas";

function parseMessageType(rawType: string) {
  if (rawType === "image") return MessageType.IMAGE;
  if (rawType === "document") return MessageType.DOCUMENT;
  return MessageType.TEXT;
}

export async function processMockIncomingMessage(input: MockIncomingMessageInput) {
  assertMockMode("WhatsApp simulation");

  const business =
    (input.businessId
      ? await prisma.business.findUnique({ where: { id: input.businessId } })
      : await prisma.business.findFirst()) ?? null;

  if (!business) {
    throw new Error("No business found for mock incoming message.");
  }

  const { customer, lead, conversation } = await findOrCreateConversationContext({
    businessId: business.id,
    phoneNumber: input.phoneNumber,
    customerName: input.customerName,
    referralMetadata: input.referral,
  });

  const inboundMessage = await recordInboundMessage({
    conversationId: conversation.id,
    providerMessageId:
      input.providerMessageId ?? `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    messageType: input.messageType,
    body: input.text,
    mediaUrl: input.mediaUrl,
    mediaMimeType: input.mediaMimeType,
    rawPayload: input,
  });

  await syncInboundActivity({
    customerId: customer.id,
    leadId: lead.id,
    conversationId: conversation.id,
  });

  const botResult = await runBotForInboundMessage({
    businessId: business.id,
    conversationId: conversation.id,
    leadId: lead.id,
    customerId: customer.id,
    inboundMessageId: inboundMessage.id,
  });

  return { business, customer, lead, conversation, inboundMessage, botResult };
}

export async function processWhatsAppWebhook(payload: unknown) {
  const parsed = whatsappWebhookSchema.parse(payload);
  const { event, duplicate } = await persistWebhookEvent({
    provider: WebhookProvider.WHATSAPP,
    eventType: "whatsapp_webhook",
    payload: payload as never,
  });

  if (duplicate) {
    return { duplicate: true };
  }

  try {
    for (const entry of parsed.entry) {
      for (const change of entry.changes) {
        const contacts = change.value.contacts ?? [];

        for (const status of change.value.statuses ?? []) {
          await updateMessageDeliveryStatus({
            providerMessageId: status.id,
            status: status.status,
            errorCode: status.errors?.[0]?.code?.toString(),
            errorMessage: status.errors?.[0]?.title,
            timestamp: status.timestamp,
          });
          await updateBroadcastDeliveryStatus({
            providerMessageId: status.id,
            status: status.status,
            errorMessage: status.errors?.[0]?.title,
            timestamp: status.timestamp,
          });
        }

        for (const message of change.value.messages ?? []) {
          const contact = contacts.find((item) => item.wa_id === message.from);

          await processMockIncomingMessage({
            phoneNumber: message.from,
            customerName: contact?.profile?.name,
            text: message.text?.body ?? message.image?.caption ?? message.document?.caption,
            messageType: parseMessageType(message.type),
            mediaUrl: message.image?.url ?? message.document?.url,
            mediaMimeType: message.image?.mime_type ?? message.document?.mime_type,
            providerMessageId: message.id,
            referral: (message.referral as Record<string, string>) ?? undefined,
          });
        }
      }
    }

    await markWebhookProcessed(event.id);
    return { duplicate: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    await markWebhookFailed(event.id, message);
    throw error;
  }
}
