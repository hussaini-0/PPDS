import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { BrandLogo } from "@/components/marketing/brand-logo";

export function SiteFooter() {
  return (
    <footer className="bg-[#151719] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div><BrandLogo /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Premium digital products and custom software for businesses ready to operate smarter.</p><Link href="https://wa.me/923480694422" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300"><MessageCircle className="size-4" /> WhatsApp support</Link></div>
        <div><h3 className="font-bold">Explore</h3><div className="mt-4 grid gap-3 text-sm text-slate-300"><Link href="/products">Digital products</Link><Link href="/deals">Deals & offers</Link><Link href="/software-development">Software development</Link><Link href="/project-request">Request a project</Link></div></div>
        <div><h3 className="font-bold">Company</h3><div className="mt-4 grid gap-3 text-sm text-slate-300"><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/faqs">FAQs</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-delivery">Delivery & returns</Link></div></div>
        <div><h3 className="font-bold">Product notes, not noise</h3><p className="mt-4 text-sm leading-6 text-slate-300">Get useful updates, new tools, and carefully selected offers.</p><div className="mt-4"><NewsletterForm /></div></div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">© 2026 PPDS. Digital products and software services.</div>
    </footer>
  );
}
