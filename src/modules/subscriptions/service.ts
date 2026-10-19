import { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSubscriptionLifecycleStatus } from "@/modules/subscriptions/logic";

export async function runSubscriptionLifecycleJob({
  businessId,
  expiringThresholdDays = 7,
}: {
  businessId?: string;
  expiringThresholdDays?: number;
} = {}) {
  const now = new Date();
  const subscriptions = await prisma.subscription.findMany({
    where: {
      businessId,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.EXPIRING,
          SubscriptionStatus.EXPIRED,
        ],
      },
    },
    include: {
      customer: true,
      lead: {
        include: { conversation: true },
      },
    },
  });

  const results = {
    active: 0,
    expiring: 0,
    expired: 0,
    remindersCreated: 0,
  };

  for (const subscription of subscriptions) {
    const nextStatus = getSubscriptionLifecycleStatus({
      expiryDate: subscription.expiryDate,
      now,
      expiringThresholdDays,
    });

    if (subscription.status !== nextStatus) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: nextStatus },
      });
    }

    if (nextStatus === "ACTIVE") results.active += 1;
    if (nextStatus === "EXPIRING") results.expiring += 1;
    if (nextStatus === "EXPIRED") results.expired += 1;

    if (
      nextStatus === "EXPIRING" &&
      subscription.lead?.conversation &&
      subscription.customer.marketingOptIn
    ) {
      const existing = await prisma.ownerAttentionItem.findFirst({
        where: {
          businessId: subscription.businessId,
          customerId: subscription.customerId,
          leadId: subscription.leadId,
          status: "OPEN",
          reason: "Subscription is expiring soon",
        },
      });

      if (!existing) {
        await prisma.ownerAttentionItem.create({
          data: {
            businessId: subscription.businessId,
            customerId: subscription.customerId,
            leadId: subscription.leadId,
            conversationId: subscription.lead.conversation.id,
            priority: "HIGH",
            reason: "Subscription is expiring soon",
            recommendedAction: "Send a permitted renewal reminder.",
          },
        });

        results.remindersCreated += 1;
      }
    }
  }

  return results;
}
