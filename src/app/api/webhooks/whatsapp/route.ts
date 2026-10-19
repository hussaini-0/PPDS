import { env } from "@/lib/env";
import { badRequest, ok, serverError } from "@/lib/http";
import { processWhatsAppWebhook } from "@/modules/whatsapp/service";
import { verifyMetaWebhookSignature } from "@/modules/whatsapp/signature";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return badRequest("Webhook verification failed.");
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (
      env.INTEGRATION_MODE === "live" &&
      !verifyMetaWebhookSignature({
        body: rawBody,
        signatureHeader: request.headers.get("x-hub-signature-256"),
        appSecret: env.META_APP_SECRET,
      })
    ) {
      return new Response("Invalid webhook signature.", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as unknown;
    const result = await processWhatsAppWebhook(payload);

    return ok({ received: true, ...result });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Webhook processing failed.");
  }
}
