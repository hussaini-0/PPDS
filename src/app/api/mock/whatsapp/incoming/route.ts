import { mockIncomingMessageSchema } from "@/modules/whatsapp/schemas";
import { processMockIncomingMessage } from "@/modules/whatsapp/service";
import { badRequest, ok, serverError } from "@/lib/http";
import { isMockMode } from "@/modules/integrations/mode";

export async function POST(request: Request) {
  if (!isMockMode()) {
    return new Response("Not found.", { status: 404 });
  }

  try {
    const payload = mockIncomingMessageSchema.parse(await request.json());
    const result = await processMockIncomingMessage(payload);

    return ok({
      conversationId: result.conversation.id,
      leadId: result.lead.id,
      customerId: result.customer.id,
      botResult: result.botResult,
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return badRequest("Invalid mock incoming message payload.", error);
    }

    return serverError(error instanceof Error ? error.message : "Failed to simulate message.");
  }
}
