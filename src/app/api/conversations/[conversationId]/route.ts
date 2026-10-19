import { notFound, ok, unauthorized } from "@/lib/http";
import { getConversationDetail } from "@/modules/conversations/service";
import { auth } from "@/modules/auth/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  const { conversationId } = await params;
  const conversation = await getConversationDetail(session.user.businessId, conversationId);

  if (!conversation) {
    return notFound("Conversation not found.");
  }

  return ok(conversation);
}
