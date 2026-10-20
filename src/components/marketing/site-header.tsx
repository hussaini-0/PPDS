import Link from "next/link";
import { Code2, Menu, MessageCircle, Search, ShoppingCart } from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { getPublicWhatsAppUrl } from "@/lib/whatsapp";

const links = [
  ["/products", "Store"],
  ["/deals", "Deals"],
  ["/software-development", "Software"],
  ["/about", "About"],
  ["/contact", "Contact"],
] as const;

export async function SiteHeader() {
  const whatsAppUrl = getPublicWhatsAppUrl();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f8fafc]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:px-7">
        <Link href="/" aria-label="PPDS home" className="shrink-0"><BrandLogo /></Link>

        <nav className="ml-4 hidden items-center gap-1 xl:flex">
          {links.map(([href, label]) => <Link key={href} href={href} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950">{label}</Link>)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/products" aria-label="Search store" className="grid size-10 place-items-center rounded-full text-slate-700 transition hover:bg-white"><Search className="size-5" /></Link>
          <Link href={whatsAppUrl} aria-label="WhatsApp support" className="hidden size-10 place-items-center rounded-full text-emerald-700 transition hover:bg-white sm:grid"><MessageCircle className="size-5" /></Link>
          <Link href="/cart" aria-label="Cart" className="grid size-10 place-items-center rounded-full text-slate-700 transition hover:bg-white"><ShoppingCart className="size-5" /></Link>
          <Link href="/project-request" className="hidden items-center gap-2 rounded-full bg-[#0878b9] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#075f93] md:flex"><Code2 className="size-4" /> Build software</Link>
          <details className="relative xl:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full text-slate-700 hover:bg-white" aria-label="Open navigation"><Menu className="size-5" /></summary>
            <nav className="absolute right-0 top-12 grid w-64 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
              {links.map(([href, label]) => <Link key={href} href={href} className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">{label}</Link>)}
              <Link href={whatsAppUrl} className="rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">WhatsApp support</Link>
              <Link href="/project-request" className="mt-1 rounded-xl bg-[#0878b9] px-3 py-2.5 text-center text-sm font-bold text-white">Build software</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
