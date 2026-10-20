"use client";

import { useActionState, useState } from "react";

import { submitCheckoutAction } from "@/app/(marketing)/checkout/[slug]/actions";

type PaymentMethod = { id: string; name: string; instructions: string };

export function CheckoutForm({ productId, productSlug, paymentMethods }: { productId: string; productSlug: string; paymentMethods: PaymentMethod[] }) {
  const [state, formAction, pending] = useActionState(submitCheckoutAction, null);
  const [selectedId, setSelectedId] = useState(paymentMethods[0]?.id ?? "");
  const selected = paymentMethods.find((item) => item.id === selectedId);

  if (paymentMethods.length === 0) {
    return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900">Online ordering is temporarily unavailable because the owner has not configured a payment method.</div>;
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input name="productId" type="hidden" value={productId} />
      <input name="productSlug" type="hidden" value={productSlug} />
      <label className="text-sm font-semibold">Payment method<select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" name="paymentMethodId" onChange={(event) => setSelectedId(event.target.value)} value={selectedId}>{paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {selected ? <div className="whitespace-pre-wrap rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700"><strong className="block text-slate-950">Payment instructions</strong>{selected.instructions}</div> : null}
      <label className="text-sm font-semibold">Transaction/reference number<input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" name="referenceNumber" /></label>
      <label className="text-sm font-semibold">Payment proof<input accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm" name="proofFile" required type="file" /></label>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><input className="mt-1 size-4 accent-cyan-700" name="acceptTerms" required type="checkbox" /><span>I have read and agree to the <a className="font-bold text-cyan-700 underline" href="/terms" target="_blank">PPDS Terms of Service</a>, including the account-usage, warranty, and refund rules.</span></label>
      {state?.error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p> : null}
      <button className="rounded-xl bg-[#0878b9] px-5 py-3.5 font-bold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Submitting order..." : "Submit order for verification"}</button>
      <p className="text-xs leading-5 text-slate-500">Your purchase status and credentials will appear in your PPDS account. Credentials are never sent through WhatsApp.</p>
    </form>
  );
}
