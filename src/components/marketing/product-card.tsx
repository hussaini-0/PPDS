import Link from "next/link";
import { ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";

import { ProductMedia } from "@/components/marketing/product-media";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product, currency }: {
  product: {
    id?: string;
    slug: string;
    name: string;
    shortDescription: string;
    price: { toString(): string } | number;
    compareAtPrice: { toString(): string } | number | null;
    badge: string | null;
    imageUrl: string | null;
    logoUrl?: string | null;
    features?: string[];
    category: { name: string };
  };
  currency: string;
}) {
  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : null;
  const media = product.logoUrl ?? product.imageUrl;
  const checkoutAvailable = Boolean(product.id);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.045)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_45px_rgba(15,23,42,.09)]">
      <div className="flex items-start gap-3">
        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {media ? <ProductMedia src={media} alt={`${product.name} logo`} fit="contain" sizes="48px" /> : <span className="text-xs font-black text-slate-700">{product.name.slice(0, 2).toUpperCase()}</span>}
        </span>
        <div className="min-w-0 flex-1"><h3 className="truncate text-lg font-black tracking-tight text-slate-950">{product.name}</h3><p className="truncate text-xs font-medium text-slate-500">{product.category.name}</p></div>
        {product.badge ? <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-700">{product.badge}</span> : null}
      </div>

      <p className="mt-5 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{product.shortDescription}</p>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> {product.features?.[0] ?? "Terms confirmed before payment"}</p>

      <Link href={`/products/${product.slug}`} className="mt-5 flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50">
        <span>View available plan</span><ArrowRight className="size-4 text-slate-400" />
      </Link>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>{checkoutAvailable ? <><p className="text-xl font-black tracking-tight text-slate-950">{formatCurrency(price, currency)}</p><div className="mt-1 flex items-center gap-2">{compareAtPrice ? <span className="text-xs text-slate-400 line-through">{formatCurrency(compareAtPrice, currency)}</span> : null}{discount ? <span className="text-[11px] font-bold text-emerald-700">Save {discount}%</span> : null}</div></> : <p className="text-sm font-bold text-amber-700">Pricing pending</p>}</div>
        <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">1 access</span>
      </div>

      <div className="mt-5 flex gap-2">
        <Link href={`/products/${product.slug}`} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#075f93,#0b93ca)] px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-900/10 transition group-hover:brightness-110">View plan <ArrowRight className="size-4" /></Link>
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="grid size-11 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700"><ShoppingCart className="size-4" /></Link>
      </div>
    </article>
  );
}
