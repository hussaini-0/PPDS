import { AttentionQueue } from "@/components/dashboard/attention-queue";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/modules/auth/session";
import { getDashboardSnapshot } from "@/modules/dashboard/service";

export default async function DashboardPage() {
  const session = await requireSession();
  const snapshot = await getDashboardSnapshot(session.user.businessId);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
        <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Overview</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {snapshot.businessName} operations
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Timezone: {snapshot.timezone}. Integration mode: {snapshot.integrationMode}.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <AttentionQueue items={snapshot.attentionQueue} />

        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">High-intent leads</h2>
              <p className="text-sm text-zinc-600">
                Leads most likely to need immediate commercial action.
              </p>
            </div>
            <div className="space-y-3">
              {snapshot.topLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <p className="font-medium">{lead.customerName}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {lead.stage} • intent {lead.intentScore}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Next follow-up: {lead.nextFollowUpAt ?? "Not scheduled"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Expiring subscriptions</h2>
              <p className="text-sm text-zinc-600">
                Renewal pressure points surfaced before decorative charts.
              </p>
            </div>
            <div className="space-y-3">
              {snapshot.subscriptionsExpiring.map((subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <p className="font-medium">{subscription.customerName}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {subscription.planName} • {subscription.status}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Expires {subscription.expiryDate}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
