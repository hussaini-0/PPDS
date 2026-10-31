import { ProductCard } from "@/components/marketing/product-card";
import { getStorefrontContent } from "@/modules/cms/service";

export const metadata = { title: "Deals & Offers | PPDS" };
export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const { business, products } = await getStorefrontContent();
  const deals = products.filter((product) => product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price));
  return <section className="mx-auto max-w-[1500px] px-4 py-12 lg:px-7"><div className="rounded-[2rem] bg-[linear-gradient(115deg,#07111f,#0878b9)] p-8 text-white md:p-12"><p className="text-sm font-bold uppercase tracking-[.2em] text-cyan-200">Published offers</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Real discounts, clearly marked.</h1><p className="mt-4 max-w-2xl text-cyan-50/80">Offers appear only when a valid comparison price is published in the CMS.</p></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{deals.map((product) => <ProductCard key={product.id} product={product} currency={business.currency} />)}</div>{deals.length === 0 ? <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No active offers are published.</p> : null}</section>;
}
