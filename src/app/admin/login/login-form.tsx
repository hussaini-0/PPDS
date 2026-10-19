"use client";

import { useActionState } from "react";

import { adminLoginAction } from "./actions";

export function AdminLoginForm() {
  const [error, formAction, pending] = useActionState(adminLoginAction, null);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block space-y-2 text-sm font-medium" htmlFor="email">
        Email
        <input className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950" id="email" name="email" autoComplete="email" required type="email" />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="password">
        Password
        <input className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950" id="password" name="password" autoComplete="current-password" required type="password" />
      </label>
      {error ? <p className="text-sm text-rose-600" role="alert">{error}</p> : null}
      <button className="w-full rounded-2xl bg-zinc-950 px-4 py-3 font-medium text-white disabled:opacity-70" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in to admin"}
      </button>
    </form>
  );
}
