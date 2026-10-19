import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";

type SendResult = {
  providerMessageId: string;
  rawResponse: Record<string, unknown>;
};

async function send(payload: Record<string, unknown>): Promise<SendResult> {
  if (env.INTEGRATION_MODE === "mock") {
    return {
      providerMessageId: `mock-${randomUUID()}`,
      rawResponse: { mock: true },
    };
  }

  if (!env.META_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Live WhatsApp credentials are not configured.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  const result = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number };
    [key: string]: unknown;
  };

  if (!response.ok || !result.messages?.[0]?.id) {
    const providerReason = result.error?.message ?? "Provider did not return a message ID.";
    throw new Error(`WhatsApp send failed (${response.status}): ${providerReason}`);
  }

  return {
    providerMessageId: result.messages[0].id,
    rawResponse: result,
  };
}

export function sendWhatsAppText(to: string, body: string) {
  return send({
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body },
  });
}

export function sendWhatsAppTemplate({
  to,
  name,
  language,
  variables = [],
}: {
  to: string;
  name: string;
  language: string;
  variables?: string[];
}) {
  return send({
    to,
    type: "template",
    template: {
      name,
      language: { code: language },
      components:
        variables.length > 0
          ? [
              {
                type: "body",
                parameters: variables.map((text) => ({ type: "text", text })),
              },
            ]
          : undefined,
    },
  });
}
