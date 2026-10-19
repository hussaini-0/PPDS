import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { getPublicWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = { title: "Contact PPDS" };

export default function ContactPage() {
  return <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">Contact</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Start with the right channel.</h1><div className="mt-10 grid gap-5 md:grid-cols-2"><Link href={getPublicWhatsAppUrl()} className="rounded-[2rem] bg-emerald-400 p-8"><MessageCircle className="size-8" /><h2 className="mt-8 text-3xl font-black">WhatsApp support</h2><p className="mt-3 text-emerald-950/75">Ask about products, packages, order support, or request a human.</p></Link><Link href="/project-request" className="rounded-[2rem] bg-[#07111f] p-8 text-white"><Mail className="size-8 text-amber-300" /><h2 className="mt-8 text-3xl font-black">Software project brief</h2><p className="mt-3 text-slate-300">Send requirements, budget range, deadline, references, and attachments.</p></Link></div></section>;
}
