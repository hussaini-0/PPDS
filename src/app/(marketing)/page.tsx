import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  MessageCircle,
  Search,
} from "lucide-react";

import { ProductMedia } from "@/components/marketing/product-media";
import { getStorefrontContent } from "@/modules/cms/service";
import { getPublicWhatsAppUrl } from "@/lib/whatsapp";
import { mergePpdsCatalogue, PPDS_CATALOG_CATEGORIES } from "@/lib/ppds-catalog";

export const dynamic = "force-dynamic";

function productInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export default async function HomePage() {
  const { business, categories, products, testimonials, pages } = await getStorefrontContent();
  const homepageContent = pages.find((page) => page.key === "homepage-intro");
  const configuredStoreProducts = products.filter((product) => product.category.slug !== "software-services");
  const storeProducts = mergePpdsCatalogue(configuredStoreProducts);
  const storeCategories = categories.filter((category) => category.slug !== "software-services");
  const catalogueCategories = storeCategories.length ? storeCategories : PPDS_CATALOG_CATEGORIES;
  const featuredProducts = storeProducts.filter((product) => product.isFeatured);
  const heroProducts = (featuredProducts.length ? featuredProducts : storeProducts).slice(0, 6);
  const whatsAppUrl = getPublicWhatsAppUrl();

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#eef3f8] px-4 pb-8 pt-7 lg:px-8 lg:pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[.24em] text-cyan-700">PPDS Store</p><h1 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Premium tools and subscriptions</h1></div>
            <Link href="/software-development" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition hover:text-cyan-700">Need custom software? <ArrowRight className="size-4" /></Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#07111f] px-5 py-8 text-white shadow-2xl shadow-slate-900/15 sm:px-9 sm:py-10 lg:min-h-[510px] lg:px-14 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(24,199,216,.35),transparent_26%),radial-gradient(circle_at_68%_88%,rgba(245,158,11,.16),transparent_24%),linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] bg-[size:auto,auto,42px_42px,42px_42px]" />
            <div className="relative grid gap-9 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">Your digital toolkit</p>
                <h2 className="mt-4 max-w-3xl text-5xl font-black leading-[.93] tracking-[-.06em] sm:text-6xl lg:text-7xl">The tools you need. <span className="text-cyan-300">Ready when you are.</span></h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{homepageContent?.summary ?? "Explore premium AI, creative, productivity, security, and entertainment subscriptions from one trusted technology partner."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">{heroProducts.map((product, index) => <Link key={product.slug} href={`/products/${product.slug}`} className={`group relative min-h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-300/70 hover:bg-white/[.12] ${index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}><span className="relative grid size-12 place-items-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg">{product.logoUrl ? <ProductMedia src={product.logoUrl} alt={`${product.name} logo`} fit="contain" sizes="48px" /> : <span className="font-black text-slate-950">{productInitials(product.name)}</span>}</span><strong className="mt-4 block truncate text-sm sm:text-base">{product.name}</strong><span className="mt-1 block truncate text-[11px] text-slate-400">{product.category.name}</span><ArrowUpRight className="absolute right-3 top-3 size-4 text-slate-500 transition group-hover:text-cyan-300" /></Link>)}</div>
            </div>
            <form action="/products" className="relative mt-8 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl sm:rounded-full">
              <Search className="ml-3 size-5 shrink-0 text-slate-500" />
              <input name="q" aria-label="Search the PPDS catalogue" className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 sm:text-base" placeholder="Search ChatGPT, Canva, Netflix, Adobe..." />
              <button className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#18c7d8] text-slate-950 transition hover:bg-cyan-300 sm:rounded-full" aria-label="Search catalogue"><ArrowRight className="size-5" /></button>
            </form>
            {heroProducts.length ? <div className="relative mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-bold text-slate-400">Popular:</span>{heroProducts.slice(0, 5).map((product) => <Link key={product.slug} href={`/products/${product.slug}`} className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:bg-white/10">{product.name}</Link>)}</div> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">Browse by need</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em]">Find your next advantage</h2></div><Link href="/products" className="hidden items-center gap-2 font-bold sm:flex">All categories <ArrowRight className="size-4" /></Link></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{catalogueCategories.slice(0, 8).map((category, index) => <Link key={category.slug} href={`/products?category=${category.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-400 hover:bg-amber-50"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-slate-100 font-black text-slate-700">{category.icon ?? String(index + 1).padStart(2, "0")}</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></div><h3 className="mt-5 font-bold">{category.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p></Link>)}</div></section>

      <section className="overflow-hidden bg-[#090b10] py-5 text-white sm:py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_88%_8%,rgba(26,199,216,.18),transparent_27%),linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.015))] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Digital catalogue</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Your workbench, ready.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Essential subscriptions and tools, clearly priced and ready to compare.</p>
              </div>
              <div className="flex w-full flex-wrap gap-2 lg:w-auto">
                <div className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-400 lg:flex-none"><Search className="size-4" /> Browse tools</div>
                <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">View all <ArrowRight className="size-4" /></Link>
              </div>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              <span className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-950">All tools</span>
              {catalogueCategories.slice(0, 6).map((category) => <Link key={category.slug} href={`/products?category=${category.slug}`} className="shrink-0 rounded-full border border-white/10 bg-white/[.035] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/60 hover:bg-white/10 hover:text-white">{category.name}</Link>)}
            </div>
            {storeProducts.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{storeProducts.slice(0, 12).map((product) => {
              const price = Number(product.price);
              const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
              const discount = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : null;
              return <Link key={product.slug} href={`/products/${product.slug}`} className="group relative flex min-w-0 flex-col rounded-2xl border border-white/10 bg-[#12161f] p-3 transition hover:-translate-y-1 hover:border-cyan-300/70 hover:bg-[#161d28] hover:shadow-xl hover:shadow-cyan-950/20">
                <div className="relative grid aspect-[1.45/1] place-items-center overflow-hidden rounded-xl border border-white/[.07] bg-[radial-gradient(circle_at_20%_10%,rgba(35,211,235,.22),transparent_38%),linear-gradient(145deg,#202838,#0e121a)]">
                  {product.imageUrl ?? product.logoUrl ? <ProductMedia src={product.imageUrl ?? product.logoUrl!} alt={`${product.name} logo`} fit="contain" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" /> : <span className="text-4xl font-black tracking-[-.08em] text-white/90">{productInitials(product.name)}</span>}
                  {product.badge ? <span className="absolute left-2 top-2 rounded-md bg-cyan-300 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">{product.badge}</span> : null}
                  {discount ? <span className="absolute right-2 top-2 rounded-md border border-emerald-300/20 bg-emerald-400/15 px-2 py-1 text-[10px] font-black text-emerald-200">-{discount}%</span> : null}
                </div>
                <div className="flex flex-1 flex-col px-1 pb-1 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300">{product.category.name}</p><h3 className="mt-1.5 truncate text-base font-bold tracking-tight">{product.name}</h3><p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-400">{product.shortDescription}</p><div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-sm font-bold text-white">{new Intl.NumberFormat("en", { style: "currency", currency: business.currency }).format(price)}</p>{compareAtPrice ? <p className="mt-0.5 text-[11px] text-slate-500 line-through">{new Intl.NumberFormat("en", { style: "currency", currency: business.currency }).format(compareAtPrice)}</p> : null}</div><span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition group-hover:border-cyan-300 group-hover:bg-cyan-300 group-hover:text-slate-950"><ArrowUpRight className="size-4" /></span></div></div>
              </Link>;
            })}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-slate-400">Published tools will appear here after they are reviewed in the CMS.</div>}
          </div>
        </div>
      </section>

      <section className="bg-[#18c7d8]"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-4 lg:px-8">{[["01","Choose","Pick a digital product or software service."],["02","Confirm","We confirm access, scope, price, and timeline."],["03","Deliver","Receive access or track project progress."],["04","Support","Get practical help after delivery."]].map(([number,title,copy]) => <div key={number}><p className="text-sm font-black">{number}</p><h3 className="mt-5 text-2xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-cyan-950/75">{copy}</p></div>)}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">Trust must be earned</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em]">Proof, not inflated claims.</h2><p className="mt-5 leading-7 text-slate-600">Customer totals, project counts, ratings, and response times remain editable CMS fields until PPDS verifies them. No invented social proof.</p><div className="mt-7 grid grid-cols-2 gap-3">{["Customers served","Projects completed","Verified rating","Support response"].map((label) => <div key={label} className="rounded-2xl border border-dashed border-slate-300 p-4"><p className="text-xl font-black">Pending</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div></div><div className="grid gap-4 sm:grid-cols-2">{testimonials.length ? testimonials.slice(0,4).map((item) => <blockquote key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="leading-7 text-slate-700">“{item.quote}”</p><footer className="mt-5 text-sm"><strong>{item.customerName}</strong><p className="text-slate-500">{item.customerRole ?? (item.isVerified ? "Verified customer" : "Sample content — verification pending")}</p></footer></blockquote>) : <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500 sm:col-span-2">Testimonials will appear after they are published in the CMS.</div>}</div></div></section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8"><div className="grid overflow-hidden rounded-[2.5rem] bg-emerald-400 lg:grid-cols-[1fr_.8fr]"><div className="p-8 md:p-12"><p className="text-sm font-bold uppercase tracking-[.2em] text-emerald-950/70">One conversation away</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em]">Not sure what you need?</h2><p className="mt-4 max-w-xl leading-7 text-emerald-950/75">Tell the PPDS WhatsApp bot what you are trying to achieve. It can answer from published products, packages, and FAQs, then bring in the owner when judgment is needed.</p><Link href={whatsAppUrl} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#07111f] px-6 py-3 font-bold text-white"><MessageCircle className="size-4" /> Start on WhatsApp</Link></div><div className="grid place-items-center bg-[#07111f] p-10 text-white"><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">PPDS assistant</p><div className="mt-4 rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-900">I can help you compare digital tools, understand software packages, and prepare a project enquiry using approved PPDS content.</div></div></div></div></section>

    </div>
  );
}
