import { LockKeyhole } from "lucide-react";

import { CustomerAuthForm } from "@/components/store/customer-auth-form";

export const metadata = { title: "Customer Login | PPDS", robots: { index: false, follow: false } };

export default async function CustomerLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <section className="mx-auto max-w-md px-4 py-20"><div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5"><LockKeyhole className="size-10 text-cyan-700" /><h1 className="mt-5 text-4xl font-black tracking-tight">Customer login</h1><p className="mt-3 leading-7 text-slate-600">View orders and access purchased credentials securely.</p><CustomerAuthForm mode="login" next={next} /></div></section>;
}
