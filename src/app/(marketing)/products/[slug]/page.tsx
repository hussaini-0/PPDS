import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";

import { formatCurrency } from "@/lib/utils";
import { getPublicWhatsAppUrl } from "@/lib/whatsapp";
import { ProductMedia } from "@/components/marketing/product-media";
import { getPublicBusiness, getPublishedProduct } from "@/modules/cms/service";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [business, product] = await Promise.all([getPublicBusiness(), getPublishedProduct(slug)]);
  if (!product) notFound();
  return <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8"><div className="grid gap-10 lg:grid-cols-2"><div className="relative grid min-h-[420px] place-items-center overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,.35),transparent_30%),linear-gradient(135deg,#07111f,#183c5f)]">{product.imageUrl ? <ProductMedia src={product.imageUrl} alt={`${product.name} product image`} sizes="(max-width: 1024px) 100vw, 50vw"/> : <><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:32px_32px]" /><span className="relative text-8xl font-black tracking-[-.08em] text-white">{product.name.slice(0,2).toUpperCase()}</span></>}</div><div className="self-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">{product.category.name}</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">{product.name}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{product.description}</p><p className="mt-7 text-3xl font-black">{formatCurrency(Number(product.price), business.currency)}</p>{product.compareAtPrice ? <p className="text-slate-400 line-through">{formatCurrency(Number(product.compareAtPrice), business.currency)}</p> : null}<ul className="mt-7 grid gap-3">{product.features.map((feature) => <li key={feature} className="flex items-center gap-3"><Check className="size-5 text-emerald-600" />{feature}</li>)}</ul><div className="mt-8 flex flex-wrap gap-3"><Link href={getPublicWhatsAppUrl(`I am interested in ${product.name}`)} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold text-slate-950"><MessageCircle className="size-4" /> Confirm on WhatsApp</Link><Link href="/products" className="rounded-full border border-slate-300 bg-white px-6 py-3 font-bold">Back to products</Link></div><p className="mt-5 text-xs leading-5 text-slate-500">Availability, account terms, delivery method, and payment instructions are confirmed before purchase. PPDS does not process card payments on this site.</p></div></div></section>;
}
