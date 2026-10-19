import { auth } from "@/modules/auth/auth";
import { sendManualMessage } from "@/modules/conversations/service";
import { badRequest, ok, unauthorized } from "@/lib/http";
import { sendMessageSchema } from "@/modules/whatsapp/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  const payload = sendMessageSchema.safeParse({
    ...(await request.json()),
    conversationId: (await params).conversationId,
  });

  if (!payload.success) {
    return badRequest("Invalid message payload.", payload.error.flatten());
  }

  try {
    const message = await sendManualMessage({
      businessId: session.user.businessId,
      actorId: session.user.id,
      conversationId: payload.data.conversationId,
      body: payload.data.body,
      templateName: payload.data.templateName,
    });

    return ok({ message }, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to send message.");
  }
}
