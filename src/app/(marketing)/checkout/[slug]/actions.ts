"use server";

import { redirect } from "next/navigation";

import { requireCustomerAccount } from "@/modules/customer-auth/session";
import { checkoutSchema } from "@/modules/store/schemas";
import { createStoreOrder } from "@/modules/store/service";

export type CheckoutState = { error?: string } | null;

export async function submitCheckoutAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const productSlug = String(formData.get("productSlug") ?? "");
  const account = await requireCustomerAccount(`/checkout/${productSlug}`);
  const parsed = checkoutSchema.safeParse({
    productId: formData.get("productId"),
    paymentMethodId: formData.get("paymentMethodId"),
    referenceNumber: formData.get("referenceNumber") || undefined,
    acceptTerms: formData.get("acceptTerms"),
  });
  const proofFile = formData.get("proofFile");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the payment details." };
  if (!(proofFile instanceof File) || proofFile.size === 0) return { error: "Upload your payment proof." };

  try {
    await createStoreOrder({ accountId: account.id, ...parsed.data, proofFile });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The order could not be submitted." };
  }
  redirect("/account?order=submitted");
}
