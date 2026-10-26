import { Prisma, WalletTransactionSource, WalletTransactionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function adjustCustomerWallet({
  businessId,
  customerAccountId,
  actorUserId,
  direction,
  amount,
  reason,
}: {
  businessId: string;
  customerAccountId: string;
  actorUserId: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  reason: string;
}) {
  const decimalAmount = new Prisma.Decimal(amount);
  if (!decimalAmount.isPositive()) throw new Error("Wallet adjustment must be greater than zero.");

  return prisma.$transaction(async (tx) => {
    const account = await tx.customerAccount.findFirst({
      where: { id: customerAccountId, businessId, isActive: true },
      include: { business: true },
    });
    if (!account) throw new Error("Customer wallet not found.");

    const updated = direction === "CREDIT"
      ? await tx.customerAccount.update({
          where: { id: account.id },
          data: { walletBalance: { increment: decimalAmount } },
        })
      : await debitWallet(tx, account.id, businessId, decimalAmount);

    const transaction = await tx.walletTransaction.create({
      data: {
        businessId,
        customerAccountId: account.id,
        actorUserId,
        type: direction === "CREDIT" ? WalletTransactionType.CREDIT : WalletTransactionType.DEBIT,
        source: WalletTransactionSource.ADMIN_ADJUSTMENT,
        amount: decimalAmount,
        balanceAfter: updated.walletBalance,
        currency: account.business.currency,
        reason: reason.trim(),
      },
    });
    await tx.auditLog.create({
      data: {
        businessId,
        actorId: actorUserId,
        action: direction === "CREDIT" ? "customer_wallet_credited" : "customer_wallet_debited",
        entityType: "WalletTransaction",
        entityId: transaction.id,
        afterState: { amount, balanceAfter: Number(updated.walletBalance), reason: reason.trim() },
      },
    });
    return transaction;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function debitWallet(
  tx: Prisma.TransactionClient,
  accountId: string,
  businessId: string,
  amount: Prisma.Decimal,
) {
  const result = await tx.customerAccount.updateMany({
    where: { id: accountId, businessId, walletBalance: { gte: amount } },
    data: { walletBalance: { decrement: amount } },
  });
  if (result.count !== 1) throw new Error("The customer wallet does not have enough funds.");
  return tx.customerAccount.findUniqueOrThrow({ where: { id: accountId } });
}
