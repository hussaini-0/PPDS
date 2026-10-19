import { auth } from "@/modules/auth/auth";
import { setHumanTakeover } from "@/modules/conversations/service";
import { badRequest, ok, unauthorized } from "@/lib/http";
import { humanTakeoverSchema } from "@/modules/whatsapp/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  const payload = humanTakeoverSchema.safeParse({
    ...(await request.json()),
    conversationId: (await params).conversationId,
  });

  if (!payload.success) {
    return badRequest("Invalid takeover payload.", payload.error.flatten());
  }

  const conversation = await setHumanTakeover({
    businessId: session.user.businessId,
    actorId: session.user.id,
    conversationId: payload.data.conversationId,
    humanTakeover: payload.data.humanTakeover,
  });

  return ok({ conversation });
}
