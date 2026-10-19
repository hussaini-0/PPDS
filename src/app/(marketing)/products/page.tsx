import Link from "next/link";

import { ProductCard } from "@/components/marketing/product-card";
import { getStorefrontContent } from "@/modules/cms/service";

export const metadata = { title: "Digital Products | PPDS", description: "Browse curated digital products, tools, and subscriptions from PPDS." };
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const { business, categories, products } = await getStorefrontContent();
  const query = q.trim().toLowerCase();
  const storeCategories = categories.filter((item) => item.slug !== "software-services");
  const filtered = products.filter((product) => {
    if (product.category.slug === "software-services") return false;
    const matchesQuery = !query || `${product.name} ${product.shortDescription} ${product.category.name}`.toLowerCase().includes(query);
    const matchesCategory = !category || product.category.slug === category;
    return matchesQuery && matchesCategory;
  });
  return <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8"><p className="text-sm font-bold uppercase tracking-[.2em] text-cyan-700">Digital marketplace</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Useful tools, clearly presented.</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Browse published PPDS products. Availability, delivery, and account terms are confirmed before payment.</p><div className="mt-8 flex flex-wrap gap-2"><Link href="/products" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold">All</Link>{storeCategories.map((item) => <Link key={item.id} href={`/products?category=${item.slug}`} className={`rounded-full border px-4 py-2 text-sm font-bold ${category === item.slug ? "border-cyan-500 bg-cyan-50" : "border-slate-300 bg-white"}`}>{item.name}</Link>)}</div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} currency={business.currency} />)}</div>{filtered.length === 0 ? <div className="mt-10 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No published products match this search.</div> : null}</section>;
}
