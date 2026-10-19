"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

type NewsletterFields = { email: string };

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewsletterFields>();

  const submit = handleSubmit(async (values) => {
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    setMessage(response.ok ? "You’re on the list." : "Could not subscribe. Check your email and try again.");
    if (response.ok) reset();
  });

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex rounded-full border border-white/20 bg-white/10 p-1">
        <input {...register("email", { required: true, pattern: /^\S+@\S+\.\S+$/ })} className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-400" placeholder="Email address" />
        <button disabled={isSubmitting} className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">Subscribe</button>
      </div>
      {errors.email ? <p className="text-xs text-rose-300">Enter a valid email address.</p> : null}
      {message ? <p className="text-xs text-slate-300">{message}</p> : null}
    </form>
  );
}
