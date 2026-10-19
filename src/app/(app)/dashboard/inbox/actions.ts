"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/session";
import { processMockIncomingMessage } from "@/modules/whatsapp/service";
import { mockIncomingMessageSchema } from "@/modules/whatsapp/schemas";
import { sendManualMessage, setHumanTakeover } from "@/modules/conversations/service";

export async function simulateIncomingMessageAction(formData: FormData) {
  const session = await requirePermission("SEND_MESSAGES");

  const payload = mockIncomingMessageSchema.safeParse({
    businessId: session.user.businessId,
    phoneNumber: formData.get("phoneNumber"),
    customerName: formData.get("customerName"),
    text: formData.get("text"),
    messageType: formData.get("messageType") || "TEXT",
    mediaUrl: formData.get("mediaUrl") || undefined,
    mediaMimeType: formData.get("mediaMimeType") || undefined,
  });

  if (!payload.success) {
    throw new Error("Invalid simulator payload.");
  }

  await processMockIncomingMessage(payload.data);
  revalidatePath("/dashboard/inbox");
}

export async function sendMessageAction(formData: FormData) {
  const session = await requirePermission("SEND_MESSAGES");
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "");

  if (!conversationId || !body.trim()) {
    throw new Error("Conversation and message body are required.");
  }

  await sendManualMessage({
    businessId: session.user.businessId,
    actorId: session.user.id,
    conversationId,
    body,
  });

  revalidatePath(`/dashboard/inbox?conversationId=${conversationId}`);
}

export async function toggleTakeoverAction(formData: FormData) {
  const session = await requirePermission("TAKE_OVER_CONVERSATIONS");
  const conversationId = String(formData.get("conversationId") ?? "");
  const humanTakeover = String(formData.get("humanTakeover") ?? "") === "true";

  if (!conversationId) {
    throw new Error("Conversation is required.");
  }

  await setHumanTakeover({
    businessId: session.user.businessId,
    actorId: session.user.id,
    conversationId,
    humanTakeover,
  });

  revalidatePath(`/dashboard/inbox?conversationId=${conversationId}`);
}
