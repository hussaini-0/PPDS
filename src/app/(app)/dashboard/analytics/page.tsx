import { BarChart3 } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/modules/auth/session";
import { getAnalyticsDashboard } from "@/modules/analytics/service";

export default async function AnalyticsPage() {
  const session = await requireSession();
  const dashboard = await getAnalyticsDashboard(session.user.businessId);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-zinc-950 p-3 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
              Analytics
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Funnel, revenue, bot, and reliability signals
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600">
              Phase 7 turns operational records into decision metrics and exposes
              audit/reliability gaps instead of hiding them behind vanity charts.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-semibold">Sales funnel</h2>
          <div className="mt-5 space-y-3">
            {dashboard.funnel.map((step) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                key={step.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{step.label}</p>
                  <Badge tone={step.dropoff > 0.5 ? "danger" : "warning"}>
                    {(step.dropoff * 100).toFixed(1)}% dropoff
                  </Badge>
                </div>
                <p className="mt-2 text-3xl font-semibold">{step.count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Bot performance</h2>
          <div className="mt-5 rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">Failed outbound messages</p>
            <p className="mt-2 text-3xl font-semibold">
              {dashboard.reliability.failedOutboundMessages}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Failed outbound WhatsApp messages in the last 30 days should be
              treated as a reliability incident when non-zero.
            </p>
          </div>
          <div className="mt-4 rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">Audited actions</p>
            <p className="mt-2 text-3xl font-semibold">
              {dashboard.reliability.auditedActionsLast30Days}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Recent owner and automation mutations recorded to audit logs.
            </p>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Revenue events</h2>
          <div className="mt-5 space-y-3">
            {dashboard.revenueEvents.map((event) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
                key={event.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.value}</p>
                  <Badge tone="success">{event.confidence}</Badge>
                </div>
                <p className="mt-1 text-zinc-600">
                  {event.source} - {event.eventTime}
                </p>
              </div>
            ))}
            {dashboard.revenueEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                No conversion revenue events in the last 30 days.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Latest audit trail</h2>
          <div className="mt-5 space-y-3">
            {dashboard.reliability.latestAuditActions.map((item) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
                key={item.id}
              >
                <p className="font-medium">{item.action}</p>
                <p className="mt-1 text-zinc-600">
                  {item.entityType} - {item.createdAt}
                </p>
              </div>
            ))}
            {dashboard.reliability.latestAuditActions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                No audit events in the last 30 days.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
