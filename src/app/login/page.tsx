import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { getPublicWhatsAppNumber, getPublicWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer WhatsApp Access | PPDS" };

export default async function CustomerAccessPage() {
  const number = getPublicWhatsAppNumber();
  const whatsAppUrl = getPublicWhatsAppUrl("Hello PPDS, I need help with my account or order.");
  const qrCode = number
    ? await QRCode.toDataURL(whatsAppUrl, { margin: 1, width: 420, errorCorrectionLevel: "H" })
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(24,199,216,.18),transparent_28%),linear-gradient(145deg,#f7f7f2,#eef6f7)] px-4 py-8 text-[#07111f]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo />
          <Link className="inline-flex items-center gap-2 text-sm font-bold" href="/">
            <ArrowLeft className="size-4" /> Back to store
          </Link>
        </div>
        <section className="mt-10 grid overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_.9fr]">
          <div className="bg-[#07111f] p-8 text-white md:p-12">
            <p className="text-sm font-bold uppercase tracking-[.25em] text-cyan-300">Customer access</p>
            <h1 className="mt-5 text-4xl font-black tracking-[-.04em] md:text-6xl">Continue with PPDS on WhatsApp.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Scan the code with your phone to ask about subscriptions, orders, renewals, support, or software projects.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-3"><ShieldCheck className="size-5 text-emerald-400" /> The QR opens the official PPDS conversation.</p>
              <p className="flex items-center gap-3"><ShieldCheck className="size-5 text-emerald-400" /> PPDS never receives your WhatsApp password or device session.</p>
            </div>
          </div>
          <div className="grid place-items-center p-8 text-center md:p-12">
            {qrCode ? (
              <div>
                <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
                  <Image alt="QR code to open the PPDS WhatsApp conversation" height={280} src={qrCode} width={280} unoptimized />
                </div>
                <p className="mt-5 text-sm text-slate-600">Scan with your phone camera, or use the button below.</p>
                <Link className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold" href={whatsAppUrl}>
                  <MessageCircle className="size-5" /> Open WhatsApp
                </Link>
              </div>
            ) : (
              <div className="max-w-sm rounded-3xl border border-amber-200 bg-amber-50 p-6 text-left">
                <h2 className="font-bold text-amber-950">WhatsApp access is being configured</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">Add `WHATSAPP_PUBLIC_NUMBER` to the server environment to enable the customer QR code.</p>
                <Link className="mt-5 inline-block font-bold text-amber-950 underline" href="/contact">Use the contact page</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
