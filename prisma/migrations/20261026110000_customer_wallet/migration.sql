-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTransactionSource" AS ENUM ('ADMIN_ADJUSTMENT', 'PURCHASE', 'REFUND');

-- AlterTable
ALTER TABLE "CustomerAccount" ADD COLUMN "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "orderId" TEXT,
    "actorUserId" TEXT,
    "type" "WalletTransactionType" NOT NULL,
    "source" "WalletTransactionSource" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WalletTransaction_positive_amount" CHECK ("amount" > 0),
    CONSTRAINT "WalletTransaction_nonnegative_balance" CHECK ("balanceAfter" >= 0)
);

CREATE INDEX "WalletTransaction_businessId_createdAt_idx" ON "WalletTransaction"("businessId", "createdAt");
CREATE INDEX "WalletTransaction_customerAccountId_createdAt_idx" ON "WalletTransaction"("customerAccountId", "createdAt");
CREATE INDEX "WalletTransaction_orderId_createdAt_idx" ON "WalletTransaction"("orderId", "createdAt");

ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StoreOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
