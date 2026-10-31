import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { auth } from "@/modules/auth/auth";

import { AdminLoginForm } from "./login-form";

export const metadata = {
  title: "PPDS Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#07111f,#123e50)] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between"><BrandLogo /><ThemeToggle className="hidden sm:grid" /></div>
        <section className="mt-8 rounded-[2rem] bg-white p-8 text-zinc-950 shadow-2xl dark:bg-slate-900 dark:text-slate-50">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-700">Restricted staff access</p>
          <h1 className="mt-3 text-3xl font-black">PPDS administration</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Authorized owners, administrators, and support staff only.</p>
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}
