"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/session";
import { prisma } from "@/lib/prisma";
import {
  approvePayment,
  createUploadedPaymentProofReview,
  requestPaymentClarification,
  rejectPayment,
} from "@/modules/payments/service";

export async function approvePaymentAction(formData: FormData) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  const paymentId = String(formData.get("paymentId") ?? "");

  if (!paymentId) throw new Error("Payment is required.");

  await approvePayment({
    businessId: session.user.businessId,
    actorId: session.user.id,
    paymentId,
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
}

export async function rejectPaymentAction(formData: FormData) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  const paymentId = String(formData.get("paymentId") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "");

  if (!paymentId) throw new Error("Payment is required.");

  await rejectPayment({
    businessId: session.user.businessId,
    actorId: session.user.id,
    paymentId,
    rejectionReason,
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
}

export async function requestClarificationAction(formData: FormData) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  const paymentId = String(formData.get("paymentId") ?? "");
  const clarificationMessage = String(formData.get("clarificationMessage") ?? "");

  if (!paymentId) throw new Error("Payment is required.");

  await requestPaymentClarification({
    businessId: session.user.businessId,
    actorId: session.user.id,
    paymentId,
    clarificationMessage,
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
}

export async function uploadPaymentProofAction(formData: FormData) {
  const session = await requirePermission("APPROVE_PAYMENTS");
  const leadId = String(formData.get("leadId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const currency = String(formData.get("currency") ?? "PKR");
  const paymentMethod = String(formData.get("paymentMethod") ?? "");
  const referenceNumber = String(formData.get("referenceNumber") ?? "") || undefined;
  const file = formData.get("proofFile");

  if (!leadId || !amount || !paymentMethod || !(file instanceof File)) {
    throw new Error("Lead, amount, method, and proof file are required.");
  }

  const lead = await prisma.lead.findFirstOrThrow({
    where: { id: leadId, businessId: session.user.businessId },
    select: { customerId: true },
  });

  await createUploadedPaymentProofReview({
    businessId: session.user.businessId,
    customerId: lead.customerId,
    leadId,
    amount,
    currency,
    paymentMethod,
    referenceNumber,
    file,
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
}
