import { createHash } from "crypto";

import type { Prisma, WebhookProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function hashPayload(payload: Prisma.JsonValue) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function persistWebhookEvent({
  provider,
  eventType,
  payload,
  externalEventId,
}: {
  provider: WebhookProvider;
  eventType: string;
  payload: Prisma.JsonValue;
  externalEventId?: string;
}) {
  const payloadHash = hashPayload(payload);

  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_payloadHash: {
        provider,
        payloadHash,
      },
    },
  });

  if (existing) {
    return { event: existing, duplicate: true };
  }

  const event = await prisma.webhookEvent.create({
    data: {
      provider,
      externalEventId,
      eventType,
      payload: payload as Prisma.InputJsonValue,
      payloadHash,
      status: "RECEIVED",
    },
  });

  return { event, duplicate: false };
}

export async function markWebhookProcessed(id: string) {
  await prisma.webhookEvent.update({
    where: { id },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      errorMessage: null,
    },
  });
}

export async function markWebhookFailed(id: string, errorMessage: string) {
  await prisma.webhookEvent.update({
    where: { id },
    data: {
      status: "FAILED",
      errorMessage,
      attemptCount: { increment: 1 },
    },
  });
}
