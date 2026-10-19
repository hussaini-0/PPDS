import { ProductCard } from "@/components/marketing/product-card";
import { getStorefrontContent } from "@/modules/cms/service";

export const metadata = { title: "Deals & Offers | PPDS" };
export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const { business, products } = await getStorefrontContent();
  const deals = products.filter((product) => product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price));
  return <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8"><div className="rounded-[2.5rem] bg-amber-400 p-8 md:p-12"><p className="text-sm font-bold uppercase tracking-[.2em]">Published offers</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Real discounts, clearly marked.</h1><p className="mt-4 max-w-2xl text-amber-950/75">Offers appear only when a valid comparison price is published in the CMS.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{deals.map((product) => <ProductCard key={product.id} product={product} currency={business.currency} />)}</div>{deals.length === 0 ? <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No active offers are published.</p> : null}</section>;
}
