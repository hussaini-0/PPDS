import Link from "next/link";
import { CheckCircle2, Clock3, ExternalLink, KeyRound, LogOut, PackageCheck, ShieldCheck } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/utils";
import { customerLogoutAction } from "@/modules/customer-auth/actions";
import { requireCustomerAccount } from "@/modules/customer-auth/session";
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/server/security/credential-encryption";

export const metadata = { title: "My Account | PPDS", robots: { index: false, follow: false } };

const statusLabel = { AWAITING_PAYMENT: "Awaiting payment", PAYMENT_REVIEW: "Payment under review", FULFILLMENT_PENDING: "Preparing access", FULFILLED: "Ready", REJECTED: "Needs attention", CANCELLED: "Cancelled" } as const;

function readCredential(value?: string) {
  if (!value) return null;
  try {
    return decryptCredential(value);
  } catch {
    return null;
  }
}

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const account = await requireCustomerAccount();
  const { order } = await searchParams;
  const orders = await prisma.storeOrder.findMany({ where: { customerId: account.customerId, businessId: account.businessId }, include: { product: true, credential: true }, orderBy: { createdAt: "desc" } });

  return <section className="mx-auto max-w-6xl px-4 py-14 lg:px-8"><div className="flex flex-col gap-5 rounded-[2rem] bg-[#07111f] p-7 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Customer portal</p><h1 className="mt-2 text-4xl font-black tracking-tight">Welcome, {account.customer.fullName}</h1><p className="mt-2 text-slate-300">Orders and credentials stay inside your account.</p></div><form action={customerLogoutAction}><button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold"><LogOut className="size-4" /> Sign out</button></form></div>
  {order === "submitted" ? <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 className="size-5" /> Order submitted. Payment verification is now pending.</div> : null}
  <div className="mt-8 grid gap-5">{orders.map((item) => { const credential = item.status === "FULFILLED" && item.credential?.status === "ACTIVE" ? readCredential(item.credential.encryptedData) : null; return <article key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">Order {item.id.slice(-8).toUpperCase()}</p><h2 className="mt-2 text-2xl font-black">{item.product.name}</h2><p className="mt-2 text-sm text-slate-500">{formatDate(item.createdAt)} · {formatCurrency(Number(item.total), item.currency)}</p></div><span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-bold ${item.status === "FULFILLED" ? "bg-emerald-100 text-emerald-800" : item.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{item.status === "FULFILLED" ? <PackageCheck className="size-4" /> : <Clock3 className="size-4" />}{statusLabel[item.status]}</span></div>
  {item.rejectionReason ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{item.rejectionReason}</p> : null}
  {credential ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-bold text-emerald-900"><KeyRound className="size-5" /> Your access credentials</div><dl className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(credential).map(([key, value]) => <div key={key} className="rounded-xl bg-white p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="mt-1 break-all font-mono text-sm">{key === "accessUrl" ? <Link className="inline-flex items-center gap-1 text-cyan-700" href={value} target="_blank">{value}<ExternalLink className="size-3" /></Link> : value}</dd></div>)}</dl>{item.credential?.instructions ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-emerald-950">{item.credential.instructions}</p> : null}{item.credential?.expiresAt ? <p className="mt-3 text-xs text-emerald-800">Access expires {formatDate(item.credential.expiresAt)}</p> : null}</div> : null}
  {item.status === "FULFILLED" && !credential ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Access is temporarily unavailable. Contact support and quote this order number.</p> : null}</article>; })}
  {orders.length === 0 ? <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center"><ShieldCheck className="mx-auto size-10 text-cyan-700" /><h2 className="mt-4 text-2xl font-black">No purchases yet</h2><p className="mt-2 text-slate-600">Choose a product to place your first order.</p><Link href="/products" className="mt-6 inline-block rounded-full bg-[#0878b9] px-6 py-3 font-bold text-white">Browse products</Link></div> : null}</div></section>;
}
