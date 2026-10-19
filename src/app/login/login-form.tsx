"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none ring-0 transition focus:border-zinc-950"
          id="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none ring-0 transition focus:border-zinc-950"
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          type="password"
          required
        />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        className="w-full rounded-2xl bg-zinc-950 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
