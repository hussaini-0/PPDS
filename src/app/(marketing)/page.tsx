import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Code2,
  Gift,
  GraduationCap,
  MessageCircle,
  MonitorPlay,
  Palette,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { ProductCard } from "@/components/marketing/product-card";
import { ProductMedia } from "@/components/marketing/product-media";
import { getPublicWhatsAppUrl } from "@/lib/whatsapp";
import { mergePpdsCatalogue, PPDS_CATALOG_CATEGORIES } from "@/lib/ppds-catalog";
import { getStorefrontContent } from "@/modules/cms/service";

export const dynamic = "force-dynamic";

const categoryIcons = [Boxes, Bot, Palette, GraduationCap, Code2, MonitorPlay];
const heroPositions = [
  "left-[8%] top-[8%] -rotate-6",
  "left-[40%] top-0 rotate-5",
  "right-[2%] top-[22%] rotate-6",
  "left-[22%] top-[48%] rotate-3",
  "right-[24%] top-[55%] -rotate-4",
  "right-[1%] bottom-0 rotate-3",
];

export default async function HomePage() {
  const { business, categories, products, faqs, pages } = await getStorefrontContent();
  const homepageContent = pages.find((page) => page.key === "homepage-intro");
  const configuredProducts = products.filter((product) => product.category.slug !== "software-services");
  const storeProducts = mergePpdsCatalogue(configuredProducts);
  const configuredCategories = categories.filter((category) => category.slug !== "software-services");
  const catalogueCategories = configuredCategories.length ? configuredCategories : PPDS_CATALOG_CATEGORIES;
  const featured = storeProducts.filter((product) => product.isFeatured);
  const heroProducts = (featured.length ? featured : storeProducts).slice(0, 6);
  const catalogueProducts = storeProducts.slice(0, 18);
  const whatsAppUrl = getPublicWhatsAppUrl();

  return (
    <main className="bg-[#f3f6fb]">
      <section className="mx-auto max-w-[1500px] px-3 pb-5 pt-3 sm:px-5 lg:px-7">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#050916] px-5 pb-7 pt-10 text-white shadow-[0_24px_80px_rgba(15,23,42,.2)] sm:px-10 sm:pb-9 lg:min-h-[480px] lg:px-14 lg:pt-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(8,120,185,.5),transparent_27%),radial-gradient(circle_at_64%_82%,rgba(24,199,216,.22),transparent_28%),linear-gradient(120deg,transparent_40%,rgba(29,78,216,.15),transparent_70%)]" />
          <div className="absolute -right-20 -top-32 size-[430px] rounded-full border border-cyan-300/20" />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.24em] text-cyan-300">PPDS digital store</p>
              <h1 className="mt-4 text-5xl font-black leading-[.92] tracking-[-.065em] sm:text-6xl lg:text-7xl">
                Premium tools, <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">one trusted partner.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {homepageContent?.summary ?? "AI, creative, productivity, security, and streaming subscriptions with clear pricing and direct PPDS support."}
              </p>
            </div>

            <div className="relative hidden min-h-72 lg:block">
              {heroProducts.map((product, index) => {
                return (
                  <Link key={product.slug} href={`/products/${product.slug}`} className={`absolute grid size-28 place-items-center rounded-[1.7rem] border border-white/20 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:z-10 hover:scale-110 hover:border-cyan-300 ${heroPositions[index]}`}>
                    <span className="relative block size-full overflow-hidden rounded-xl bg-white p-2">
                      {product.logoUrl ? <ProductMedia src={product.logoUrl} alt={`${product.name} logo`} fit="contain" sizes="80px" /> : <span className="grid size-full place-items-center text-xl font-black text-slate-800">{product.name.slice(0, 2).toUpperCase()}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <form action="/products" className="relative mt-8 flex items-center rounded-2xl bg-white p-2 text-slate-950 shadow-[0_12px_45px_rgba(14,165,233,.25)] sm:rounded-full">
            <Search className="ml-3 size-6 shrink-0 text-slate-400" />
            <input name="q" aria-label="Search the PPDS catalogue" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400 sm:text-lg" placeholder="Search any tool — ChatGPT, Canva, Netflix..." />
            <button className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#0878b9] text-white transition hover:bg-[#075f93] sm:rounded-full" aria-label="Search catalogue"><ArrowRight className="size-5" /></button>
          </form>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-slate-400">Popular:</span>
            {heroProducts.slice(0, 5).map((product) => <Link key={product.slug} href={`/products/${product.slug}`} className="rounded-full border border-white/10 bg-white/[.08] px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300 hover:bg-white/15">{product.name}</Link>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-7">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <Link href="/products" className="flex min-h-24 flex-col items-center justify-center rounded-2xl bg-[#07111f] px-3 py-4 text-center text-white shadow-sm"><Boxes className="size-5" /><span className="mt-2 text-xs font-bold">All products</span></Link>
          {catalogueCategories.slice(0, 5).map((category, index) => {
            const Icon = categoryIcons[index + 1] ?? Sparkles;
            return <Link key={category.slug} href={`/products?category=${category.slug}`} className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-700"><Icon className="size-5" /><span className="mt-2 text-xs font-bold">{category.name}</span></Link>;
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-3 px-3 py-5 sm:px-5 lg:grid-cols-2 lg:px-7">
        <Link href="/deals" className="group flex min-h-28 items-center justify-between overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#07111f,#0878b9)] px-6 py-5 text-white shadow-lg shadow-blue-900/10">
          <span className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Gift className="size-6" /></span><span><strong className="block text-lg">Deals &amp; offers</strong><small className="mt-1 block text-blue-100">Published discounts, clearly marked</small></span></span><ArrowRight className="size-5 transition group-hover:translate-x-1" />
        </Link>
        <Link href="/software-development" className="group flex min-h-28 items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-900 shadow-sm">
          <span className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><Code2 className="size-6" /></span><span><strong className="block text-lg">Need custom software?</strong><small className="mt-1 block text-slate-500">Websites, web apps, AI automation, and mobile apps</small></span></span><ArrowRight className="size-5 transition group-hover:translate-x-1" />
        </Link>
      </section>

      <section className="mx-auto max-w-[1500px] px-3 pb-8 sm:px-5 lg:px-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-cyan-700">Complete catalogue</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Browse all plans</h2><p className="mt-2 text-sm text-slate-500">{storeProducts.length} tools available to compare</p></div>
          <Link href="/products" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><SlidersHorizontal className="size-4" /> View filters</Link>
        </div>

        {catalogueProducts.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{catalogueProducts.map((product) => <ProductCard key={product.slug} product={product} currency={business.currency} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Published products will appear here after they are reviewed in the CMS.</div>}

        <div className="mt-7 text-center"><Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#07111f] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#123049]">Browse the full catalogue <ArrowRight className="size-4" /></Link></div>
      </section>

      <section className="mx-auto max-w-[1500px] px-3 py-8 sm:px-5 lg:px-7">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><ShieldCheck className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700">Simple and transparent</p><h2 className="mt-1 text-2xl font-black tracking-tight">How PPDS delivery works</h2></div></div>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {["Choose a tool", "Confirm the exact plan", "Complete payment", "Receive access and support"].map((step, index) => <div key={step} className="rounded-2xl bg-slate-50 p-5"><span className="grid size-8 place-items-center rounded-full bg-[#07111f] text-xs font-black text-white">{index + 1}</span><h3 className="mt-4 font-bold">{step}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{index === 0 ? "Compare published tools and prices." : index === 1 ? "We confirm duration, access method, and availability." : index === 2 ? "Use the agreed secure payment method." : "Get delivery details and continued PPDS help."}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-3 py-8 sm:px-5 lg:grid-cols-[1.15fr_.85fr] lg:px-7">
        <div className="rounded-[2rem] bg-[#07111f] p-7 text-white sm:p-10"><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">PPDS support promise</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Clear terms before you pay.</h2><div className="mt-7 grid gap-4 sm:grid-cols-2">{["Plan duration confirmed", "Access method explained", "Delivery expectations stated", "Support route provided"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"><CheckCircle2 className="size-5 shrink-0 text-cyan-300" /><span className="text-sm font-semibold">{item}</span></div>)}</div></div>
        <div className="rounded-[2rem] bg-emerald-400 p-7 sm:p-10"><MessageCircle className="size-8" /><h2 className="mt-6 text-3xl font-black tracking-[-.04em]">Need help choosing?</h2><p className="mt-3 leading-7 text-emerald-950/75">Ask PPDS about plans, availability, delivery, or custom software before purchasing.</p><Link href={whatsAppUrl} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#07111f] px-6 py-3 text-sm font-bold text-white">Chat on WhatsApp <ArrowRight className="size-4" /></Link></div>
      </section>

      {faqs.length ? <section className="mx-auto max-w-5xl px-3 py-14 sm:px-5"><p className="text-center text-xs font-black uppercase tracking-[.2em] text-cyan-700">Questions before checkout</p><h2 className="mt-3 text-center text-3xl font-black tracking-[-.04em]">Frequently asked questions</h2><div className="mt-8 grid gap-3">{faqs.slice(0, 6).map((faq) => <details key={faq.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">{faq.question}<span className="text-cyan-700 transition group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}</div></section> : null}
    </main>
  );
}
