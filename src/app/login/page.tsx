import { redirect } from "next/navigation";

import { auth } from "@/modules/auth/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#111827_0%,#1d4ed8_40%,#f8fafc_100%)] px-4 py-12 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.3fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-black/20 p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-200">
            PPDS Control Center
          </p>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight">
            Manage products, enquiries, subscriptions, and customer conversations.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-blue-50/85">
            One secure workspace for your marketplace content, software projects,
            WhatsApp operations, and customer support.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/15 bg-white p-8 text-zinc-950 shadow-2xl">
          <h2 className="text-2xl font-semibold">Owner login</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in with the account issued by your PPDS administrator.
          </p>

          <LoginForm />
        </section>
      </div>
    </div>
  );
}
