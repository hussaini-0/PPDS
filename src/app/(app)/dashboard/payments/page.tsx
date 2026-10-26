import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePermission } from "@/modules/auth/session";
import { prisma } from "@/lib/prisma";

import {
  approvePaymentAction,
  requestClarificationAction,
  rejectPaymentAction,
  uploadPaymentProofAction,
  adjustCustomerWalletAction,
} from "./actions";

const reviewStatuses = ["PROOF_RECEIVED", "UNDER_REVIEW"] as const;

export default async function PaymentsPage() {
  const session = await requirePermission("APPROVE_PAYMENTS");
  const [payments, openLeads, customerAccounts, walletTransactions] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId: session.user.businessId },
      include: {
        customer: true,
        lead: { include: { selectedPlan: true } },
        subscription: { include: { plan: true } },
        proofFile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.lead.findMany({
      where: {
        businessId: session.user.businessId,
        selectedPlanId: { not: null },
        stage: {
          in: [
            "INTERESTED",
            "PAYMENT_INSTRUCTIONS_SENT",
            "PAYMENT_PROOF_RECEIVED",
          ],
        },
      },
      include: {
        customer: true,
        selectedPlan: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.customerAccount.findMany({
      where: { businessId: session.user.businessId, isActive: true },
      include: { customer: true, business: true },
      orderBy: { customer: { fullName: "asc" } },
      take: 200,
    }),
    prisma.walletTransaction.findMany({
      where: { businessId: session.user.businessId },
      include: { customerAccount: { include: { customer: true } }, actorUser: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const reviewPayments = payments.filter((payment) =>
    reviewStatuses.includes(payment.status as (typeof reviewStatuses)[number]),
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Customer funds</p><h1 className="mt-2 text-2xl font-black">PPDS Wallets</h1><p className="mt-1 text-sm text-zinc-600">Credit or debit customer balances. Every change is recorded with the acting admin and reason.</p></div><Badge>{customerAccounts.length} wallets</Badge></div>
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-x-auto rounded-2xl border border-zinc-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Adjustment</th></tr></thead><tbody className="divide-y divide-zinc-100">{customerAccounts.map((account) => <tr key={account.id}><td className="px-4 py-3"><p className="font-bold">{account.customer.fullName}</p><p className="text-xs text-zinc-500">{account.email}</p></td><td className="px-4 py-3 font-bold">{formatCurrency(Number(account.walletBalance), account.business.currency)}</td><td className="px-4 py-3"><form action={adjustCustomerWalletAction} className="grid grid-cols-[100px_120px_1fr_auto] gap-2"><input name="customerAccountId" type="hidden" value={account.id} /><select className="rounded-lg border border-zinc-300 bg-white px-2 py-2" name="direction"><option value="CREDIT">Credit</option><option value="DEBIT">Debit</option></select><input className="rounded-lg border border-zinc-300 px-3 py-2" min="1" name="amount" placeholder="Amount" required step="0.01" type="number" /><input className="rounded-lg border border-zinc-300 px-3 py-2" name="reason" placeholder="Audit reason" required /><button className="rounded-lg bg-zinc-950 px-4 py-2 font-bold text-white">Apply</button></form></td></tr>)}{customerAccounts.length === 0 ? <tr><td className="px-4 py-8 text-center text-zinc-500" colSpan={3}>Customers appear here after creating a storefront account.</td></tr> : null}</tbody></table></div>
          <div className="rounded-2xl bg-zinc-950 p-5 text-white"><h2 className="font-bold">Recent wallet activity</h2><div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">{walletTransactions.map((transaction) => <div className="rounded-xl bg-white/8 p-3" key={transaction.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{transaction.customerAccount.customer.fullName}</p><p className="mt-1 text-xs text-zinc-400">{transaction.reason}</p></div><span className={transaction.type === "CREDIT" ? "text-emerald-300" : "text-amber-300"}>{transaction.type === "CREDIT" ? "+" : "-"}{formatCurrency(Number(transaction.amount), transaction.currency)}</span></div><p className="mt-2 text-[11px] text-zinc-500">{formatDate(transaction.createdAt)} · {transaction.actorUser?.name ?? "Store checkout"}</p></div>)}{walletTransactions.length === 0 ? <p className="text-sm text-zinc-400">No wallet transactions yet.</p> : null}</div></div>
        </div>
      </Card>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Payment verification queue</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Approvals activate subscriptions only inside the backend transaction.
              </p>
            </div>
            <Badge tone={reviewPayments.length > 0 ? "danger" : "success"}>
              {reviewPayments.length} awaiting review
            </Badge>
          </div>

          <div className="space-y-3">
            {reviewPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{payment.customer.fullName}</p>
                      <Badge tone="warning">{payment.status}</Badge>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Plan
                        </dt>
                        <dd className="font-medium text-zinc-900">
                          {payment.lead?.selectedPlan?.name ?? "No selected plan"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Amount
                        </dt>
                        <dd className="font-medium text-zinc-900">
                          {formatCurrency(Number(payment.amount), payment.currency)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Method
                        </dt>
                        <dd>{payment.paymentMethod}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Submitted
                        </dt>
                        <dd>{payment.submittedAt ? formatDate(payment.submittedAt) : "Not submitted"}</dd>
                      </div>
                    </dl>
                    {payment.proofFile ? (
                      <p className="mt-3 text-xs text-zinc-500">
                        Proof: {payment.proofFile.originalName} ({payment.proofFile.mimeType})
                      </p>
                    ) : null}
                  </div>

                  <div className="flex min-w-64 flex-col gap-3">
                    <form action={approvePaymentAction}>
                      <input name="paymentId" type="hidden" value={payment.id} />
                      <button
                        className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
                        type="submit"
                      >
                        Approve and activate
                      </button>
                    </form>
                    <form action={rejectPaymentAction} className="space-y-2">
                      <input name="paymentId" type="hidden" value={payment.id} />
                      <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                        name="rejectionReason"
                        placeholder="Rejection reason"
                        required
                      />
                      <button
                        className="w-full rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700"
                        type="submit"
                      >
                        Reject proof
                      </button>
                    </form>
                    <form action={requestClarificationAction} className="space-y-2">
                      <input name="paymentId" type="hidden" value={payment.id} />
                      <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                        name="clarificationMessage"
                        placeholder="Clarification request"
                        required
                      />
                      <button
                        className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
                        type="submit"
                      >
                        Request clarification
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}

            {reviewPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                No payment proofs are waiting for owner verification.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Upload proof manually</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Use this for local mock mode or owner-assisted proof submission.
            </p>
          </div>
          <form action={uploadPaymentProofAction} className="space-y-3">
            <select
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="leadId"
              required
            >
              <option value="">Select lead</option>
              {openLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.customer.fullName} - {lead.selectedPlan?.name}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              min="1"
              name="amount"
              placeholder="Amount"
              required
              type="number"
            />
            <input name="currency" type="hidden" value="PKR" />
            <select
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="paymentMethod"
              required
            >
              <option value="Bank transfer">Bank transfer</option>
              <option value="Easypaisa">Easypaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
            <input
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="referenceNumber"
              placeholder="Reference number"
            />
            <input
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="proofFile"
              required
              type="file"
            />
            <button
              className="w-full rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
              type="submit"
            >
              Create review item
            </button>
          </form>
        </Card>
      </section>

      <Card>
        <h2 className="text-xl font-semibold">Payment history</h2>
        <div className="mt-5 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3">{payment.customer.fullName}</td>
                  <td className="px-4 py-3">{payment.paymentMethod}</td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(Number(payment.amount), payment.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {payment.subscription?.plan.name ?? "Not activated"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
