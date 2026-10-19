import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireSession } from "@/modules/auth/session";
import { prisma } from "@/lib/prisma";

const statusTabs = [
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW",
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "CANCELLED",
  "PAUSED",
] as const;

export default async function SubscriptionsPage() {
  const session = await requireSession();
  const subscriptions = await prisma.subscription.findMany({
    where: { businessId: session.user.businessId },
    include: {
      customer: true,
      plan: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: [{ status: "asc" }, { expiryDate: "asc" }],
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Subscriptions</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Active, expiring, expired, paused, and cancelled customer access.
            </p>
          </div>
          <Badge tone="neutral">{subscriptions.length} total</Badge>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {statusTabs.map((status) => (
            <Badge key={status} tone="neutral">
              {status}: {subscriptions.filter((item) => item.status === status).length}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {subscription.customer.fullName}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {subscription.plan.name}
                </p>
              </div>
              <Badge
                tone={
                  subscription.status === "ACTIVE"
                    ? "success"
                    : subscription.status === "EXPIRING"
                      ? "warning"
                      : subscription.status === "EXPIRED"
                        ? "danger"
                        : "neutral"
                }
              >
                {subscription.status}
              </Badge>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Amount
                </dt>
                <dd className="mt-1 font-medium">
                  {formatCurrency(Number(subscription.amount))}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Billing
                </dt>
                <dd className="mt-1 font-medium">{subscription.billingInterval}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Started
                </dt>
                <dd className="mt-1">{formatDate(subscription.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Expires
                </dt>
                <dd className="mt-1">{formatDate(subscription.expiryDate)}</dd>
              </div>
            </dl>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <p className="font-medium">Recent payments</p>
              <div className="mt-2 space-y-1 text-zinc-600">
                {subscription.payments.length > 0 ? (
                  subscription.payments.map((payment) => (
                    <p key={payment.id}>
                      {payment.status} -{" "}
                      {formatCurrency(Number(payment.amount), payment.currency)}
                    </p>
                  ))
                ) : (
                  <p>No payments linked yet.</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
