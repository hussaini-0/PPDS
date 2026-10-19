import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Cart | PPDS" };

export default function CartPage() {
  return <section className="mx-auto max-w-3xl px-4 py-24 text-center lg:px-8"><ShoppingBag className="mx-auto size-12 text-amber-600" /><h1 className="mt-6 text-4xl font-black tracking-tight">Your enquiry cart is empty</h1><p className="mt-4 leading-7 text-slate-600">PPDS confirms product availability and payment instructions before purchase. Online card checkout is intentionally not enabled.</p><Link href="/products" className="mt-7 inline-block rounded-full bg-[#07111f] px-6 py-3 font-bold text-white">Browse products</Link></section>;
}
