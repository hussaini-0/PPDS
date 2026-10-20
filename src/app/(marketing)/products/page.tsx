import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { ProductCard } from "@/components/marketing/product-card";
import { mergePpdsCatalogue, PPDS_CATALOG_CATEGORIES } from "@/lib/ppds-catalog";
import { getStorefrontContent } from "@/modules/cms/service";

export const metadata = { title: "Digital Products | PPDS", description: "Browse curated digital products, tools, and subscriptions from PPDS." };
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const { business, categories, products } = await getStorefrontContent();
  const query = q.trim().toLowerCase();
  const storeCategories = categories.filter((item) => item.slug !== "software-services");
  const catalogueCategories = storeCategories.length ? storeCategories : PPDS_CATALOG_CATEGORIES;
  const catalogueProducts = mergePpdsCatalogue(products.filter((product) => product.category.slug !== "software-services"));
  const filtered = catalogueProducts.filter((product) => {
    const matchesQuery = !query || `${product.name} ${product.shortDescription} ${product.category.name}`.toLowerCase().includes(query);
    const matchesCategory = !category || product.category.slug === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#f3f6fb]">
      <section className="mx-auto max-w-[1500px] px-3 py-10 sm:px-5 lg:px-7">
        <div className="rounded-[2rem] bg-[#07111f] p-6 text-white sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">PPDS catalogue</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">Find the right plan.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">Search digital tools, compare published pricing, and purchase directly through secure website checkout.</p>
          <form action="/products" className="mt-7 flex max-w-3xl items-center rounded-full bg-white p-2 text-slate-950"><Search className="ml-3 size-5 text-slate-400" /><input name="q" defaultValue={q} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none" placeholder="Search tools and subscriptions..." /><button className="rounded-full bg-[#0878b9] px-5 py-2.5 text-sm font-bold text-white">Search</button></form>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          <Link href={q ? `/products?q=${encodeURIComponent(q)}` : "/products"} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold ${!category ? "border-[#07111f] bg-[#07111f] text-white" : "border-slate-200 bg-white text-slate-600"}`}>All products</Link>
          {catalogueCategories.map((item) => <Link key={item.slug} href={`/products?category=${item.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold ${category === item.slug ? "border-[#07111f] bg-[#07111f] text-white" : "border-slate-200 bg-white text-slate-600"}`}>{item.name}</Link>)}
        </div>

        <div className="mt-6 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-700">Complete catalogue</p><h2 className="mt-2 text-3xl font-black tracking-tight">{filtered.length} matching tools</h2></div><SlidersHorizontal className="size-5 text-slate-400" /></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <ProductCard key={product.slug} product={product} currency={business.currency} />)}</div>
        {filtered.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No services match this search.</div> : null}
      </section>
    </main>
  );
}
