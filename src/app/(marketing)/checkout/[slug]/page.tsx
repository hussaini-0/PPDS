import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { CheckoutForm } from "@/components/store/checkout-form";
import { ProductMedia } from "@/components/marketing/product-media";
import { formatCurrency } from "@/lib/utils";
import { getPublishedProduct, getPublicBusiness } from "@/modules/cms/service";
import { requireCustomerAccount } from "@/modules/customer-auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Checkout | PPDS", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireCustomerAccount(`/checkout/${slug}`);
  const [business, product] = await Promise.all([getPublicBusiness(), getPublishedProduct(slug)]);
  if (!product) notFound();
  const paymentMethods = await prisma.storePaymentMethod.findMany({ where: { businessId: business.id, isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, instructions: true } });

  return <section className="mx-auto max-w-5xl px-4 py-14 lg:px-8"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><aside className="rounded-[2rem] bg-[#07111f] p-6 text-white"><div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white/10">{product.logoUrl || product.imageUrl ? <ProductMedia alt={`${product.name} logo`} fit="contain" sizes="360px" src={product.logoUrl ?? product.imageUrl!} /> : <span className="text-6xl font-black">{product.name.slice(0, 2).toUpperCase()}</span>}</div><h1 className="mt-6 text-3xl font-black">{product.name}</h1><p className="mt-3 leading-7 text-slate-300">{product.shortDescription}</p><p className="mt-6 text-3xl font-black">{formatCurrency(Number(product.price), business.currency)}</p><div className="mt-6 flex items-center gap-2 text-sm text-cyan-200"><ShieldCheck className="size-4" /> Credentials delivered in your PPDS account</div></aside><div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Secure checkout</p><h2 className="mt-2 text-3xl font-black">Complete your order</h2><p className="mt-3 mb-7 text-sm leading-6 text-slate-600">Pay using an available method, upload proof, and track verification from your account.</p><CheckoutForm paymentMethods={paymentMethods} productId={product.id} productSlug={product.slug} /></div></div></section>;
}
