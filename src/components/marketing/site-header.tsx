import Link from "next/link";
import { Heart, Menu, MessageCircle, Search, ShoppingBag } from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { getFeaturedStorefrontProducts } from "@/modules/cms/service";
import { getPublicWhatsAppUrl } from "@/lib/whatsapp";

const links = [
  ["/", "Home"],
  ["/products", "Subscriptions"],
  ["/software-development", "Software Development"],
  ["/deals", "Deals & Offers"],
  ["/about", "About"],
  ["/contact", "Contact"],
] as const;

export async function SiteHeader() {
  const featuredProducts = await getFeaturedStorefrontProducts();
  const whatsAppUrl = getPublicWhatsAppUrl();
  const announcement = featuredProducts.length
    ? `${featuredProducts.map((product) => product.name).join(" · ")} subscriptions`
    : "Premium digital subscriptions · WhatsApp support";
  return (
    <>
      <div className="bg-[linear-gradient(90deg,#151719,#0c3442,#151719)] px-4 py-2 text-center text-xs font-medium tracking-wide text-white">
        {announcement}
      </div>
      <header className="sticky top-0 z-50 border-b border-cyan-950/10 bg-[#f7f7f2]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 lg:px-8">
          <Link href="/" aria-label="PPDS home" className="shrink-0">
            <BrandLogo />
          </Link>
          <form action="/products" className="hidden min-w-0 flex-1 lg:flex">
            <label className="flex w-full items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">
              <Search className="size-4" />
              <input className="min-w-0 flex-1 bg-transparent outline-none" name="q" placeholder="Search tools and subscriptions..." />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/products" aria-label="Wishlist" className="hidden rounded-full border border-slate-300 p-2.5 hover:bg-white sm:block"><Heart className="size-4" /></Link>
            <Link href="/cart" aria-label="Cart" className="rounded-full border border-slate-300 p-2.5 hover:bg-white"><ShoppingBag className="size-4" /></Link>
            <Link href="/project-request" className="hidden rounded-full bg-[#18c7d8] px-5 py-2.5 text-sm font-bold text-[#07111f] hover:bg-[#38d5e2] md:block">Build my software</Link>
          </div>
        </div>
        <div className="border-t border-slate-200/70">
          <nav className="mx-auto hidden max-w-7xl items-center gap-7 px-8 py-3 text-sm font-semibold text-slate-700 lg:flex">
            {links.map(([href, label]) => <Link key={href} href={href} className="hover:text-cyan-700">{label}</Link>)}
            <Link href="/faqs" className="hover:text-cyan-700">FAQs</Link>
            <Link href={whatsAppUrl} className="ml-auto flex items-center gap-2 text-emerald-700"><MessageCircle className="size-4" /> WhatsApp support</Link>
          </nav>
          <details className="px-4 py-3 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold"><Menu className="size-4" /> Menu</summary>
            <nav className="mt-3 grid gap-2 rounded-2xl bg-white p-3 shadow-lg">
              {links.map(([href, label]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 hover:bg-slate-50">{label}</Link>)}
              <Link href="/project-request" className="rounded-xl bg-[#18c7d8] px-3 py-2 font-bold">Build my software</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
