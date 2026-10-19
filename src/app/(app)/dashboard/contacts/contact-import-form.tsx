"use client";

import { useActionState } from "react";

import { importContactsAction, type ContactImportState } from "./actions";

const initialState: ContactImportState = { status: "idle" };

export function ContactImportForm() {
  const [state, action, pending] = useActionState(importContactsAction, initialState);

  return (
    <form action={action} className="mt-5 space-y-4">
      <label className="block rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm">
        <span className="block font-medium">Contacts CSV</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">Required columns: name, phone. Optional: email, city, notes, tags, marketing_consent.</span>
        <input className="mt-4 block w-full text-sm" name="contacts" type="file" accept=".csv,text/csv" required />
      </label>
      <button className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Importing..." : "Import potential customers"}
      </button>
      {state.message ? (
        <div className={`rounded-2xl p-4 text-sm ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`} role="status">
          <p className="font-medium">{state.message}</p>
          {state.status === "success" ? <p className="mt-1">{state.createdCustomers} created, {state.updatedCustomers} updated, {state.createdLeads} new leads.</p> : null}
          {state.rejectedRows?.length ? (
            <ul className="mt-3 space-y-1 text-xs">
              {state.rejectedRows.map((error) => <li key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
