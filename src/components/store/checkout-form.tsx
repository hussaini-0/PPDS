"use client";

import { useActionState, useState } from "react";
import { WalletCards } from "lucide-react";

import { submitCheckoutAction } from "@/app/(marketing)/checkout/[slug]/actions";
import { formatCurrency } from "@/lib/utils";

type PaymentMethod = { id: string; name: string; instructions: string };

export function CheckoutForm({ productId, productSlug, productPrice, walletBalance, currency, paymentMethods }: { productId: string; productSlug: string; productPrice: number; walletBalance: number; currency: string; paymentMethods: PaymentMethod[] }) {
  const [state, formAction, pending] = useActionState(submitCheckoutAction, null);
  const [selectedId, setSelectedId] = useState(paymentMethods[0]?.id ?? "");
  const [checkoutType, setCheckoutType] = useState<"wallet" | "manual">(walletBalance >= productPrice ? "wallet" : "manual");
  const selected = paymentMethods.find((item) => item.id === selectedId);
  const walletCanPay = walletBalance >= productPrice;

  return (
    <form action={formAction} className="grid gap-5">
      <input name="productId" type="hidden" value={productId} />
      <input name="productSlug" type="hidden" value={productSlug} />
      <input name="checkoutType" type="hidden" value={checkoutType} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button className={`rounded-2xl border p-4 text-left ${checkoutType === "wallet" ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100" : "border-slate-200"}`} onClick={() => setCheckoutType("wallet")} type="button"><span className="flex items-center gap-2 font-bold"><WalletCards className="size-5 text-cyan-700" /> PPDS Wallet</span><span className="mt-2 block text-sm text-slate-600">Balance: {formatCurrency(walletBalance, currency)}</span></button>
        <button className={`rounded-2xl border p-4 text-left ${checkoutType === "manual" ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100" : "border-slate-200"}`} disabled={paymentMethods.length === 0} onClick={() => setCheckoutType("manual")} type="button"><span className="font-bold">Manual payment</span><span className="mt-2 block text-sm text-slate-600">Upload payment proof for review.</span></button>
      </div>
      {checkoutType === "wallet" ? <div className={`rounded-2xl border p-4 text-sm leading-6 ${walletCanPay ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{walletCanPay ? `Your wallet will be charged ${formatCurrency(productPrice, currency)} immediately.` : `You need ${formatCurrency(productPrice - walletBalance, currency)} more in your wallet. Contact support or use manual payment.`}</div> : null}
      {checkoutType === "manual" ? <><label className="text-sm font-semibold">Payment method<select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" name="paymentMethodId" onChange={(event) => setSelectedId(event.target.value)} required value={selectedId}>{paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {selected ? <div className="whitespace-pre-wrap rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700"><strong className="block text-slate-950">Payment instructions</strong>{selected.instructions}</div> : <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">No manual payment method is currently available.</div>}
      <label className="text-sm font-semibold">Transaction/reference number<input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" name="referenceNumber" /></label>
      <label className="text-sm font-semibold">Payment proof<input accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm" name="proofFile" required type="file" /></label></> : null}
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><input className="mt-1 size-4 accent-cyan-700" name="acceptTerms" required type="checkbox" /><span>I have read and agree to the <a className="font-bold text-cyan-700 underline" href="/terms" target="_blank">PPDS Terms of Service</a>, including the account-usage, warranty, and refund rules.</span></label>
      {state?.error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p> : null}
      <button className="rounded-xl bg-[#0878b9] px-5 py-3.5 font-bold text-white disabled:opacity-60" disabled={pending || (checkoutType === "wallet" && !walletCanPay) || (checkoutType === "manual" && paymentMethods.length === 0)} type="submit">{pending ? "Processing order..." : checkoutType === "wallet" ? "Pay with wallet" : "Submit order for verification"}</button>
      <p className="text-xs leading-5 text-slate-500">Your purchase status and credentials will appear in your PPDS account. Credentials are never sent through WhatsApp.</p>
    </form>
  );
}
