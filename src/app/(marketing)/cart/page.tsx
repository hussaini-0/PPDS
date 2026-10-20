import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Cart | PPDS" };

export default function CartPage() {
  return <section className="mx-auto max-w-3xl px-4 py-24 text-center lg:px-8"><ShoppingBag className="mx-auto size-12 text-cyan-700" /><h1 className="mt-6 text-4xl font-black tracking-tight">Choose a product to continue</h1><p className="mt-4 leading-7 text-slate-600">PPDS uses direct checkout for each digital product. Purchases and credentials are managed securely in your customer account.</p><div className="mt-7 flex justify-center gap-3"><Link href="/products" className="rounded-full bg-[#07111f] px-6 py-3 font-bold text-white">Browse products</Link><Link href="/account" className="rounded-full border border-slate-300 bg-white px-6 py-3 font-bold">My account</Link></div></section>;
}
