import Link from "next/link";
import { ArrowUpRight, Heart, ShieldCheck } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { ProductMedia } from "@/components/marketing/product-media";

export function ProductCard({ product, currency }: {
  product: {
    slug: string;
    name: string;
    shortDescription: string;
    price: { toString(): string } | number;
    compareAtPrice: { toString(): string } | number | null;
    badge: string | null;
    imageUrl: string | null;
    logoUrl?: string | null;
    category: { name: string };
  };
  currency: string;
}) {
  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden border-b border-slate-100 bg-slate-50">
        {product.imageUrl?.startsWith("/") ? (
          <ProductMedia src={product.imageUrl} alt={`${product.name} product image`} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        ) : product.imageUrl ? (
          <ProductMedia src={product.imageUrl} alt={`${product.name} product image`} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        ) : product.logoUrl ? (
          <ProductMedia src={product.logoUrl} alt={`${product.name} logo`} fit="contain" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        ) : (
          <><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(24,199,216,.35),transparent_30%),linear-gradient(135deg,#101820,#17415a)]" /><span className="relative text-5xl font-black tracking-[-0.08em] text-white/90">{product.name.slice(0, 2).toUpperCase()}</span></>
        )}
        {product.badge ? <span className="absolute left-3 top-3 rounded-full bg-[#18c7d8] px-3 py-1 text-xs font-bold text-slate-950">{product.badge}</span> : null}
        {discount ? <span className="absolute right-3 top-3 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">-{discount}%</span> : null}
        <button aria-label={`Save ${product.name}`} className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 text-slate-800"><Heart className="size-4" /></button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">{product.category.name}</p>
        <h3 className="mt-2 text-xl font-bold tracking-tight">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.shortDescription}</p>
        <div className="mt-3 flex items-center gap-1.5 text-emerald-700"><ShieldCheck className="size-4" /><span className="text-xs font-semibold text-slate-600">Terms confirmed before payment</span></div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div><p className="font-bold text-slate-950">{formatCurrency(price, currency)}</p>{compareAtPrice ? <p className="text-xs text-slate-400 line-through">{formatCurrency(compareAtPrice, currency)}</p> : null}</div>
          <Link href={`/products/${product.slug}`} className="grid size-10 place-items-center rounded-full bg-[#151719] text-white transition group-hover:bg-[#18c7d8] group-hover:text-slate-950" aria-label={`View ${product.name}`}><ArrowUpRight className="size-4" /></Link>
        </div>
      </div>
    </article>
  );
}
