import type { PaymentStatus } from "@prisma/client";

const APPROVABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  "PROOF_RECEIVED",
  "UNDER_REVIEW",
];

const REVIEWABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  "PROOF_RECEIVED",
  "UNDER_REVIEW",
];

export function canApprovePayment(status: PaymentStatus) {
  return APPROVABLE_PAYMENT_STATUSES.includes(status);
}

export function canRejectPayment(status: PaymentStatus) {
  return REVIEWABLE_PAYMENT_STATUSES.includes(status);
}

export function validateProofFile({
  mimeType,
  size,
}: {
  mimeType: string;
  size: number;
}) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);
  const maxSize = 8 * 1024 * 1024;

  if (!allowedTypes.has(mimeType)) {
    return { valid: false, reason: "Unsupported payment-proof file type." };
  }

  if (size > maxSize) {
    return { valid: false, reason: "Payment proof exceeds the 8 MB limit." };
  }

  return { valid: true, reason: "File is valid." };
}
