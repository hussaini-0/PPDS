import { createHash } from "crypto";

import {
  LeadStage,
  MessageDirection,
  MessageSenderType,
  MessageStatus,
  MessageType,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
  type MessageType as PrismaMessageType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { cancelPendingFollowUps } from "@/modules/follow-ups/service";
import {
  canApprovePayment,
  canRejectPayment,
  validateProofFile,
} from "@/modules/payments/logic";
import { calculateExpiryDate } from "@/modules/subscriptions/logic";
import { getStorageProvider } from "@/server/storage/provider";

export async function createPaymentProofReviewItem({
  businessId,
  customerId,
  leadId,
  conversationId,
  amount,
  currency,
  paymentMethod,
  referenceNumber,
  proofFile,
}: {
  businessId: string;
  customerId: string;
  leadId: string;
  conversationId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string;
    proofFile: {
    mediaUrl?: string;
    mimeType?: string;
    originalName: string;
    messageType: PrismaMessageType;
  };
}) {
  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      businessId,
      customerId,
      storageProvider: "provider-reference",
      storageKey: proofFile.mediaUrl ?? `proof-${Date.now()}`,
      originalName: proofFile.originalName,
      mimeType: proofFile.mimeType ?? "application/octet-stream",
      size: 0,
      checksum: `provider:${proofFile.mediaUrl ?? "none"}`,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      businessId,
      customerId,
      leadId,
      amount,
      currency,
      paymentMethod,
      referenceNumber,
      status: PaymentStatus.PROOF_RECEIVED,
      proofFileId: uploadedFile.id,
      submittedAt: new Date(),
    },
  });

  await prisma.ownerAttentionItem.create({
    data: {
      businessId,
      customerId,
      leadId,
      conversationId,
      priority: "URGENT",
      reason: "Payment proof submitted and awaiting manual verification",
      recommendedAction: "Review proof and approve or reject the payment.",
    },
  });

  return payment;
}

export async function createUploadedPaymentProofReview({
  businessId,
  customerId,
  leadId,
  amount,
  currency,
  paymentMethod,
  referenceNumber,
  file,
}: {
  businessId: string;
  customerId: string;
  leadId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string;
  file: File;
}) {
  const validation = validateProofFile({
    mimeType: file.type,
    size: file.size,
  });

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const storage = await getStorageProvider().save({
    buffer,
    originalName: file.name,
  });

  const lead = await prisma.lead.findFirstOrThrow({
    where: { id: leadId, businessId, customerId },
    include: { conversation: true },
  });

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      businessId,
      customerId,
      storageProvider: storage.storageProvider,
      storageKey: storage.storageKey,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      checksum,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      businessId,
      customerId,
      leadId,
      amount,
      currency,
      paymentMethod,
      referenceNumber,
      status: PaymentStatus.PROOF_RECEIVED,
      proofFileId: uploadedFile.id,
      submittedAt: new Date(),
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: LeadStage.PAYMENT_PROOF_RECEIVED,
      humanAttentionRequired: true,
      humanAttentionReason: "Payment proof received and awaiting review",
    },
  });

  if (lead.conversation) {
    await prisma.ownerAttentionItem.create({
      data: {
        businessId,
        customerId,
        leadId,
        conversationId: lead.conversation.id,
        priority: "URGENT",
        reason: "Payment proof submitted and awaiting manual verification",
        recommendedAction: "Review proof and approve or reject the payment.",
      },
    });
  }

  return payment;
}

export async function approvePayment({
  businessId,
  paymentId,
  actorId,
}: {
  businessId: string;
  paymentId: string;
  actorId: string;
}) {
  const payment = await prisma.payment.findFirstOrThrow({
    where: { id: paymentId, businessId },
    include: {
      customer: true,
      lead: {
        include: {
          selectedPlan: true,
          conversation: true,
        },
      },
      subscription: true,
    },
  });

  if (!canApprovePayment(payment.status)) {
    throw new Error(`Payment with status ${payment.status} cannot be approved.`);
  }

  const plan = payment.lead?.selectedPlan;

  if (!plan) {
    throw new Error("Payment cannot be approved because no selected plan is linked to the lead.");
  }

  const now = new Date();
  const expiryDate = calculateExpiryDate(
    now,
    plan.billingInterval,
    plan.durationDays,
  );

  const result = await prisma.$transaction(async (tx) => {
    const subscription =
      payment.subscription ??
      (await tx.subscription.create({
        data: {
          businessId,
          customerId: payment.customerId,
          planId: plan.id,
          leadId: payment.leadId,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          expiryDate,
          amount: payment.amount,
          billingInterval: plan.billingInterval,
          activatedByUserId: actorId,
          activatedAt: now,
        },
      }));

    const activeSubscription = await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startDate: subscription.startDate ?? now,
        expiryDate,
        amount: payment.amount,
        billingInterval: plan.billingInterval,
        activatedByUserId: actorId,
        activatedAt: now,
      },
    });

    const verifiedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.VERIFIED,
        verifiedAt: now,
        verifiedByUserId: actorId,
        subscriptionId: activeSubscription.id,
      },
    });

    if (payment.leadId) {
      await tx.lead.update({
        where: { id: payment.leadId },
        data: {
          stage: LeadStage.CONVERTED,
          convertedAt: now,
          humanAttentionRequired: false,
          humanAttentionReason: null,
          nextFollowUpAt: null,
        },
      });
    }

    await tx.ownerAttentionItem.updateMany({
      where: {
        businessId,
        leadId: payment.leadId,
        status: "OPEN",
      },
      data: {
        status: "RESOLVED",
        resolvedAt: now,
      },
    });

    if (payment.lead?.conversation) {
      await tx.message.create({
        data: {
          conversationId: payment.lead.conversation.id,
          direction: MessageDirection.OUTBOUND,
          senderType: MessageSenderType.SYSTEM,
          messageType: MessageType.TEXT,
          body: `Payment verified. Your ${plan.name} subscription is active until ${expiryDate.toDateString()}.`,
          status: MessageStatus.SENT,
          sentAt: now,
        },
      });
    }

    await tx.attributionEvent.create({
      data: {
        businessId,
        customerId: payment.customerId,
        leadId: payment.leadId,
        subscriptionId: activeSubscription.id,
        eventType: "SUBSCRIPTION_CONVERTED",
        eventTime: now,
        metaCampaignId: payment.lead?.metaCampaignId,
        metaAdSetId: payment.lead?.metaAdSetId,
        metaAdId: payment.lead?.metaAdId,
        source: payment.lead?.source,
        value: payment.amount,
        currency: payment.currency,
        externalEventId: `payment:${payment.id}`,
        confidence: payment.lead?.metaAdId ? "EXACT_REFERRAL" : "UNKNOWN",
        rawPayload: Prisma.JsonNull,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        actorId,
        action: "payment_approved_subscription_activated",
        entityType: "Payment",
        entityId: payment.id,
        beforeState: {
          paymentStatus: payment.status,
          subscriptionId: payment.subscriptionId,
        },
        afterState: {
          paymentStatus: PaymentStatus.VERIFIED,
          subscriptionId: activeSubscription.id,
          expiryDate: expiryDate.toISOString(),
        },
      },
    });

    return { payment: verifiedPayment, subscription: activeSubscription };
  });

  if (payment.leadId) {
    await cancelPendingFollowUps({
      leadId: payment.leadId,
      reason: "Payment approved and subscription activated.",
    });
  }

  return result;
}

export async function rejectPayment({
  businessId,
  paymentId,
  actorId,
  rejectionReason,
}: {
  businessId: string;
  paymentId: string;
  actorId: string;
  rejectionReason: string;
}) {
  const trimmedReason = rejectionReason.trim();

  if (!trimmedReason) {
    throw new Error("Rejection reason is required.");
  }

  const payment = await prisma.payment.findFirstOrThrow({
    where: { id: paymentId, businessId },
    include: {
      lead: {
        include: {
          conversation: true,
        },
      },
    },
  });

  if (!canRejectPayment(payment.status)) {
    throw new Error(`Payment with status ${payment.status} cannot be rejected.`);
  }

  return prisma.$transaction(async (tx) => {
    const rejectedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REJECTED,
        rejectionReason: trimmedReason,
      },
    });

    if (payment.leadId) {
      await tx.lead.update({
        where: { id: payment.leadId },
        data: {
          stage: LeadStage.PAYMENT_INSTRUCTIONS_SENT,
          humanAttentionRequired: true,
          humanAttentionReason: "Payment proof rejected",
        },
      });
    }

    if (payment.lead?.conversation) {
      await tx.message.create({
        data: {
          conversationId: payment.lead.conversation.id,
          direction: MessageDirection.OUTBOUND,
          senderType: MessageSenderType.SYSTEM,
          messageType: MessageType.TEXT,
          body: `Payment proof could not be verified: ${trimmedReason}. Please send a clearer proof or contact the owner for clarification.`,
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        businessId,
        actorId,
        action: "payment_rejected",
        entityType: "Payment",
        entityId: payment.id,
        beforeState: { paymentStatus: payment.status },
        afterState: {
          paymentStatus: PaymentStatus.REJECTED,
          rejectionReason: trimmedReason,
        },
      },
    });

    return rejectedPayment;
  });
}

export async function requestPaymentClarification({
  businessId,
  paymentId,
  actorId,
  clarificationMessage,
}: {
  businessId: string;
  paymentId: string;
  actorId: string;
  clarificationMessage: string;
}) {
  const trimmedMessage = clarificationMessage.trim();

  if (!trimmedMessage) {
    throw new Error("Clarification message is required.");
  }

  const payment = await prisma.payment.findFirstOrThrow({
    where: { id: paymentId, businessId },
    include: {
      lead: {
        include: {
          conversation: true,
        },
      },
    },
  });

  if (!canRejectPayment(payment.status)) {
    throw new Error(`Payment with status ${payment.status} cannot be clarified.`);
  }

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.UNDER_REVIEW,
        notes: trimmedMessage,
      },
    });

    if (payment.leadId) {
      await tx.lead.update({
        where: { id: payment.leadId },
        data: {
          stage: LeadStage.PAYMENT_UNDER_REVIEW,
          humanAttentionRequired: true,
          humanAttentionReason: "Payment proof needs customer clarification",
        },
      });
    }

    if (payment.lead?.conversation) {
      await tx.message.create({
        data: {
          conversationId: payment.lead.conversation.id,
          direction: MessageDirection.OUTBOUND,
          senderType: MessageSenderType.OWNER,
          messageType: MessageType.TEXT,
          body: trimmedMessage,
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        businessId,
        actorId,
        action: "payment_clarification_requested",
        entityType: "Payment",
        entityId: payment.id,
        beforeState: { paymentStatus: payment.status },
        afterState: {
          paymentStatus: PaymentStatus.UNDER_REVIEW,
          clarificationMessage: trimmedMessage,
        },
      },
    });

    return updatedPayment;
  });
}
