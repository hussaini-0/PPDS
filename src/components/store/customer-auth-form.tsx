"use client";

import Link from "next/link";
import { useActionState } from "react";

import { customerLoginAction, customerRegisterAction } from "@/modules/customer-auth/actions";

const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100";

export function CustomerAuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const action = mode === "login" ? customerLoginAction : customerRegisterAction;
  const [state, formAction, pending] = useActionState(action, null);
  const alternateHref = `${mode === "login" ? "/account/register" : "/account/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input name="next" type="hidden" value={next ?? "/account"} />
      {mode === "register" ? <label className="text-sm font-semibold">Full name<input className={field} name="fullName" required /></label> : null}
      <label className="text-sm font-semibold">Email<input autoComplete="email" className={field} name="email" required type="email" /></label>
      {mode === "register" ? <label className="text-sm font-semibold">Phone number<input autoComplete="tel" className={field} name="phoneNumber" placeholder="+923001234567" required /></label> : null}
      <label className="text-sm font-semibold">Password<input autoComplete={mode === "login" ? "current-password" : "new-password"} className={field} minLength={mode === "register" ? 10 : 1} name="password" required type="password" /></label>
      {mode === "register" ? <label className="text-sm font-semibold">Confirm password<input autoComplete="new-password" className={field} minLength={10} name="confirmPassword" required type="password" /></label> : null}
      {state?.error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p> : null}
      <button className="rounded-xl bg-[#0878b9] px-5 py-3.5 font-bold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
      <p className="text-center text-sm text-slate-600">{mode === "login" ? "New to PPDS?" : "Already registered?"} <Link className="font-bold text-cyan-700" href={alternateHref}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
    </form>
  );
}
