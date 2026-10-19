import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/modules/auth/session";
import { isMockMode } from "@/modules/integrations/mode";
import {
  getConversationDetail,
  listRecentConversations,
} from "@/modules/conversations/service";

import {
  sendMessageAction,
  simulateIncomingMessageAction,
  toggleTakeoverAction,
} from "./actions";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const session = await requireSession();
  const mockMode = isMockMode();
  const params = await searchParams;
  const conversations = await listRecentConversations(session.user.businessId);
  const selectedConversationId = params.conversationId ?? conversations[0]?.id ?? null;
  const selectedConversation = selectedConversationId
    ? await getConversationDetail(session.user.businessId, selectedConversationId)
    : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Conversations</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {mockMode
                ? "Webhook and simulator traffic land here."
                : "Live WhatsApp conversations and delivery events land here."}
            </p>
          </div>
          <Badge tone={mockMode ? "warning" : "success"}>
            {mockMode ? "Simulator" : "Live"}
          </Badge>
        </div>

        {mockMode ? (
        <form action={simulateIncomingMessageAction} className="mt-5 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium">Simulate incoming WhatsApp lead</p>
          <input
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            name="customerName"
            placeholder="Customer name"
          />
          <input
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            name="phoneNumber"
            placeholder="03XXXXXXXXX"
            required
          />
          <textarea
            className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            name="text"
            placeholder="I came from your ad and want details."
            required
          />
          <button
            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Simulate inbound message
          </button>
        </form>
        ) : null}

        <div className="mt-4 space-y-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/inbox?conversationId=${conversation.id}`}
              className={`block rounded-2xl border p-4 ${
                selectedConversationId === conversation.id
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{conversation.customer.fullName}</p>
                {conversation.humanTakeover ? (
                  <Badge tone="danger">Human</Badge>
                ) : (
                  <Badge tone="success">Bot</Badge>
                )}
              </div>
              <p
                className={`mt-1 text-sm ${
                  selectedConversationId === conversation.id
                    ? "text-zinc-300"
                    : "text-zinc-600"
                }`}
              >
                {conversation.lead?.stage ?? "No lead stage"}
              </p>
              <p
                className={`mt-2 text-xs line-clamp-2 ${
                  selectedConversationId === conversation.id
                    ? "text-zinc-400"
                    : "text-zinc-500"
                }`}
              >
                {conversation.messages.at(-1)?.body ?? "No messages yet"}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="min-h-[32rem]">
        {selectedConversation ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedConversation.customer.fullName}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedConversation.customer.normalizedPhoneNumber}
                </p>
              </div>
              <form action={toggleTakeoverAction}>
                <input
                  name="conversationId"
                  type="hidden"
                  value={selectedConversation.id}
                />
                <input
                  name="humanTakeover"
                  type="hidden"
                  value={selectedConversation.humanTakeover ? "false" : "true"}
                />
                <button
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium"
                  type="submit"
                >
                  {selectedConversation.humanTakeover
                    ? "Return control to bot"
                    : "Take over manually"}
                </button>
              </form>
            </div>

            <div className="mt-5 space-y-3">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    message.direction === "INBOUND"
                      ? "bg-zinc-100 text-zinc-950"
                      : message.senderType === "BOT"
                        ? "ml-auto bg-amber-100 text-amber-950"
                        : "ml-auto bg-zinc-950 text-white"
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-60">
                    {message.senderType}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {message.body ?? `${message.messageType} message`}
                  </p>
                </div>
              ))}
            </div>

            <form action={sendMessageAction} className="mt-5 space-y-3 border-t border-zinc-200 pt-5">
              <input
                name="conversationId"
                type="hidden"
                value={selectedConversation.id}
              />
              <textarea
                className="min-h-24 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                name="body"
                placeholder="Send a manual WhatsApp reply"
                required
              />
              <button
                className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
                type="submit"
              >
                Send manual message
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Thread view</h2>
            <p className="mt-3 text-sm text-zinc-600">
              No conversation selected yet.
            </p>
          </>
        )}
      </Card>

      <Card className="min-h-[32rem]">
        {selectedConversation ? (
          <>
            <h2 className="text-xl font-semibold">Context panel</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Lead stage
                </p>
                <p className="mt-1 font-medium">
                  {selectedConversation.lead?.stage ?? "No lead"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Bot step
                </p>
                <p className="mt-1 font-medium">
                  {selectedConversation.botState?.currentStep ?? "Not started"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Service window
                </p>
                <p className="mt-1 font-medium">
                  {selectedConversation.serviceWindowExpiresAt
                    ? "Open"
                    : "Template required"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Open attention items
                </p>
                <div className="mt-2 space-y-2">
                  {selectedConversation.attentionItems.length > 0 ? (
                    selectedConversation.attentionItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                      >
                        <p className="font-medium">{item.reason}</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          {item.recommendedAction}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">No open attention items.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Context panel</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Customer, lead, plan, subscription, and bot state will appear here.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
