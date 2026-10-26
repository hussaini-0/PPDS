import { createHash } from "crypto";
import { CmsPublicationStatus, Prisma, StoreOrderStatus, WalletTransactionSource, WalletTransactionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { validateProofFile } from "@/modules/payments/logic";
import { encryptCredential } from "@/server/security/credential-encryption";
import { getStorageProvider } from "@/server/storage/provider";

export async function createStoreOrder({
  accountId,
  productId,
  paymentMethodId,
  referenceNumber,
  acceptTerms,
  proofFile,
}: {
  accountId: string;
  productId: string;
  paymentMethodId: string;
  referenceNumber?: string;
  acceptTerms: "on";
  proofFile: File;
}) {
  if (acceptTerms !== "on") throw new Error("Terms of Service acceptance is required.");
  const validation = validateProofFile({ mimeType: proofFile.type, size: proofFile.size });
  if (!validation.valid) throw new Error(validation.reason);

  const account = await prisma.customerAccount.findFirstOrThrow({
    where: { id: accountId, isActive: true },
    include: { business: true },
  });
  const [product, paymentMethod] = await Promise.all([
    prisma.product.findFirst({
      where: { id: productId, businessId: account.businessId, status: CmsPublicationStatus.PUBLISHED },
    }),
    prisma.storePaymentMethod.findFirst({
      where: { id: paymentMethodId, businessId: account.businessId, isActive: true },
    }),
  ]);
  if (!product) throw new Error("This product is no longer available.");
  if (!paymentMethod) throw new Error("This payment method is not available.");

  const buffer = Buffer.from(await proofFile.arrayBuffer());
  const stored = await getStorageProvider().save({ buffer, originalName: proofFile.name });

  return prisma.$transaction(async (tx) => {
    const uploaded = await tx.uploadedFile.create({
      data: {
        businessId: account.businessId,
        customerId: account.customerId,
        storageProvider: stored.storageProvider,
        storageKey: stored.storageKey,
        originalName: proofFile.name,
        mimeType: proofFile.type,
        size: proofFile.size,
        checksum: createHash("sha256").update(buffer).digest("hex"),
      },
    });
    const order = await tx.storeOrder.create({
      data: {
        businessId: account.businessId,
        customerId: account.customerId,
        productId: product.id,
        status: StoreOrderStatus.PAYMENT_REVIEW,
        unitPrice: product.price,
        total: product.price,
        currency: account.business.currency,
        paymentMethod: paymentMethod.name,
        paymentMethodId: paymentMethod.id,
        referenceNumber: referenceNumber || null,
        termsVersion: "2026-10-21",
        termsAcceptedAt: new Date(),
        paymentProofFileId: uploaded.id,
        submittedAt: new Date(),
      },
    });
    await tx.ownerAttentionItem.create({
      data: {
        businessId: account.businessId,
        customerId: account.customerId,
        priority: "URGENT",
        reason: `Store payment submitted for ${product.name}`,
        recommendedAction: `Review store order ${order.id}, then approve or reject the payment.`,
      },
    });
    await tx.auditLog.create({
      data: {
        businessId: account.businessId,
        action: "store_order_submitted",
        entityType: "StoreOrder",
        entityId: order.id,
        afterState: { productId: product.id, paymentMethod: paymentMethod.name, total: Number(product.price) },
      },
    });
    return order;
  });
}

export async function createWalletStoreOrder({
  accountId,
  productId,
  acceptTerms,
}: {
  accountId: string;
  productId: string;
  acceptTerms: "on";
}) {
  if (acceptTerms !== "on") throw new Error("Terms of Service acceptance is required.");

  return prisma.$transaction(async (tx) => {
    const account = await tx.customerAccount.findFirst({
      where: { id: accountId, isActive: true },
      include: { business: true },
    });
    if (!account) throw new Error("Your customer account is not available.");

    const product = await tx.product.findFirst({
      where: { id: productId, businessId: account.businessId, status: CmsPublicationStatus.PUBLISHED },
    });
    if (!product) throw new Error("This product is no longer available.");

    const debited = await tx.customerAccount.updateMany({
      where: { id: account.id, businessId: account.businessId, isActive: true, walletBalance: { gte: product.price } },
      data: { walletBalance: { decrement: product.price } },
    });
    if (debited.count !== 1) throw new Error("Your wallet does not have enough funds for this purchase.");

    const updatedAccount = await tx.customerAccount.findUniqueOrThrow({ where: { id: account.id } });
    const order = await tx.storeOrder.create({
      data: {
        businessId: account.businessId,
        customerId: account.customerId,
        productId: product.id,
        status: StoreOrderStatus.FULFILLMENT_PENDING,
        unitPrice: product.price,
        total: product.price,
        currency: account.business.currency,
        paymentMethod: "PPDS Wallet",
        termsVersion: "2026-10-21",
        termsAcceptedAt: new Date(),
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
    });
    await tx.walletTransaction.create({
      data: {
        businessId: account.businessId,
        customerAccountId: account.id,
        orderId: order.id,
        type: WalletTransactionType.DEBIT,
        source: WalletTransactionSource.PURCHASE,
        amount: product.price,
        balanceAfter: updatedAccount.walletBalance,
        currency: account.business.currency,
        reason: `Purchase of ${product.name}`,
      },
    });
    await tx.ownerAttentionItem.create({
      data: {
        businessId: account.businessId,
        customerId: account.customerId,
        priority: "URGENT",
        reason: `Wallet order ready for fulfillment: ${product.name}`,
        recommendedAction: `Assign credentials to store order ${order.id}.`,
      },
    });
    await tx.auditLog.create({
      data: {
        businessId: account.businessId,
        action: "wallet_store_order_created",
        entityType: "StoreOrder",
        entityId: order.id,
        afterState: { productId: product.id, total: Number(product.price), balanceAfter: Number(updatedAccount.walletBalance) },
      },
    });
    return order;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function approveStoreOrder({ businessId, orderId, actorId }: { businessId: string; orderId: string; actorId: string }) {
  const order = await prisma.storeOrder.findFirstOrThrow({ where: { id: orderId, businessId } });
  if (order.status !== StoreOrderStatus.PAYMENT_REVIEW) throw new Error("Only payments under review can be approved.");
  return prisma.$transaction([
    prisma.storeOrder.update({
      where: { id: order.id },
      data: { status: StoreOrderStatus.FULFILLMENT_PENDING, reviewedAt: new Date(), reviewedByUserId: actorId, rejectionReason: null },
    }),
    prisma.auditLog.create({
      data: { businessId, actorId, action: "store_payment_approved", entityType: "StoreOrder", entityId: order.id },
    }),
  ]);
}

export async function rejectStoreOrder({ businessId, orderId, actorId, reason }: { businessId: string; orderId: string; actorId: string; reason: string }) {
  const rejectionReason = reason.trim();
  if (!rejectionReason) throw new Error("A rejection reason is required.");
  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findFirstOrThrow({ where: { id: orderId, businessId } });
    if (order.status !== StoreOrderStatus.PAYMENT_REVIEW && order.status !== StoreOrderStatus.FULFILLMENT_PENDING) throw new Error("This order cannot be rejected.");

    if (order.paymentMethod === "PPDS Wallet") {
      const purchase = await tx.walletTransaction.findFirst({
        where: { orderId: order.id, source: WalletTransactionSource.PURCHASE },
      });
      const existingRefund = await tx.walletTransaction.findFirst({
        where: { orderId: order.id, source: WalletTransactionSource.REFUND },
      });
      if (purchase && !existingRefund) {
        const account = await tx.customerAccount.update({
          where: { customerId: order.customerId },
          data: { walletBalance: { increment: order.total } },
        });
        await tx.walletTransaction.create({
          data: {
            businessId,
            customerAccountId: account.id,
            orderId: order.id,
            actorUserId: actorId,
            type: WalletTransactionType.CREDIT,
            source: WalletTransactionSource.REFUND,
            amount: order.total,
            balanceAfter: account.walletBalance,
            currency: order.currency,
            reason: `Refund for rejected order ${order.id.slice(-8).toUpperCase()}`,
          },
        });
      }
    }

    const rejected = await tx.storeOrder.update({
      where: { id: order.id },
      data: { status: StoreOrderStatus.REJECTED, rejectionReason, reviewedAt: new Date(), reviewedByUserId: actorId },
    });
    await tx.auditLog.create({
      data: { businessId, actorId, action: "store_order_rejected", entityType: "StoreOrder", entityId: order.id, afterState: { rejectionReason, walletRefunded: order.paymentMethod === "PPDS Wallet" } },
    });
    return rejected;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function fulfillStoreOrder({
  businessId,
  orderId,
  actorId,
  credential,
  instructions,
  expiresAt,
}: {
  businessId: string;
  orderId: string;
  actorId: string;
  credential: Record<string, string>;
  instructions?: string;
  expiresAt?: Date;
}) {
  const order = await prisma.storeOrder.findFirstOrThrow({ where: { id: orderId, businessId } });
  if (order.status !== StoreOrderStatus.FULFILLMENT_PENDING) throw new Error("Approve the payment before assigning credentials.");
  const now = new Date();
  const encryptedData = encryptCredential(credential);

  return prisma.$transaction(async (tx) => {
    await tx.storeCredential.upsert({
      where: { orderId: order.id },
      update: { encryptedData, instructions: instructions || null, expiresAt: expiresAt ?? null, status: "ACTIVE" },
      create: {
        businessId,
        customerId: order.customerId,
        productId: order.productId,
        orderId: order.id,
        encryptedData,
        instructions: instructions || null,
        expiresAt: expiresAt ?? null,
      },
    });
    const fulfilled = await tx.storeOrder.update({
      where: { id: order.id },
      data: { status: StoreOrderStatus.FULFILLED, fulfilledAt: now, reviewedByUserId: actorId },
    });
    await tx.ownerAttentionItem.updateMany({
      where: { businessId, customerId: order.customerId, status: "OPEN", OR: [{ reason: { contains: "Store payment submitted" } }, { reason: { contains: "Wallet order ready for fulfillment" } }] },
      data: { status: "RESOLVED", resolvedAt: now },
    });
    await tx.auditLog.create({
      data: { businessId, actorId, action: "store_credentials_assigned", entityType: "StoreOrder", entityId: order.id, afterState: { fulfilledAt: now.toISOString() } },
    });
    return fulfilled;
  });
}
