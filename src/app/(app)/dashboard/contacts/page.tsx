import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/session";

import { ContactImportForm } from "./contact-import-form";

export default async function ContactsPage() {
  const session = await requirePermission("MANAGE_CUSTOMERS");
  const customers = await prisma.customer.findMany({
    where: { businessId: session.user.businessId },
    include: { leads: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-zinc-950 p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">Customer pipeline</p>
        <h1 className="mt-3 text-3xl font-black">Contacts and potential customers</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">Import opted-in or prospect contacts without granting marketing consent by default. Every valid contact receives a deduplicated customer record and an open lead.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-semibold">Import CSV</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Use international phone numbers when possible. Separate multiple tags with `|` or `;`. Set marketing_consent to yes only when you can prove consent.</p>
          <ContactImportForm />
          <div className="mt-5 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
            name,phone,email,city,tags,marketing_consent<br />
            Ayesha Khan,+923001234567,ayesha@example.com,Lahore,prospect|retail,no
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-xl font-semibold">Recent contacts</h2><p className="mt-1 text-sm text-zinc-600">Showing the latest 100 records.</p></div>
            <Badge>{customers.length} shown</Badge>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500"><th className="px-3 py-3">Contact</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Stage</th><th className="px-3 py-3">Consent</th><th className="px-3 py-3">Source</th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr className="border-b border-zinc-100" key={customer.id}>
                    <td className="px-3 py-3"><p className="font-medium">{customer.fullName}</p><p className="text-xs text-zinc-500">{customer.email ?? "No email"}</p></td>
                    <td className="px-3 py-3">{customer.normalizedPhoneNumber}</td>
                    <td className="px-3 py-3"><Badge tone={customer.leads[0]?.stage === "NEW" ? "warning" : "neutral"}>{customer.leads[0]?.stage ?? "NO LEAD"}</Badge></td>
                    <td className="px-3 py-3"><Badge tone={customer.marketingOptIn ? "success" : "neutral"}>{customer.marketingOptIn ? "Opted in" : "Not opted in"}</Badge></td>
                    <td className="px-3 py-3 text-zinc-600">{customer.source ?? "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 ? <p className="py-10 text-center text-sm text-zinc-500">No contacts yet. Import a CSV to begin.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
