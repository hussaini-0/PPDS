import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { requireSession } from "@/modules/auth/session";
import { isMockMode } from "@/modules/integrations/mode";
import { getMetaAdsDashboard } from "@/modules/meta-ads/service";

import { sendMetaConversionsAction, syncMetaAdsAction } from "./actions";

export default async function MetaAdsPage() {
  const session = await requireSession();
  const mockMode = isMockMode();
  const dashboard = await getMetaAdsDashboard(session.user.businessId);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
              Meta Ads
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Paid acquisition and attribution
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600">
              Campaign reporting joins Meta insight rows with WhatsApp leads,
              verified subscription revenue, and conversion attribution records.
            </p>
          </div>
          {mockMode ? <div className="flex flex-wrap gap-2">
            <form action={syncMetaAdsAction}>
              <button
                className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
                type="submit"
              >
                Sync mock insights
              </button>
            </form>
            <form action={sendMetaConversionsAction}>
              <button
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium"
                type="submit"
              >
                Send conversion events
              </button>
            </form>
          </div> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-zinc-500">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
            <p className="mt-2 text-sm text-zinc-600">{metric.helper}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Campaign performance</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Spend, messaging leads, conversions, and attributed revenue by campaign.
              </p>
            </div>
            <Badge tone="warning">{dashboard.accounts.length} ad account</Badge>
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Spend</th>
                  <th className="px-4 py-3">Leads</th>
                  <th className="px-4 py-3">Conversions</th>
                  <th className="px-4 py-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dashboard.campaignPerformance.map((campaign) => (
                  <tr key={campaign.campaignId}>
                    <td className="px-4 py-3 font-medium">{campaign.campaignName}</td>
                    <td className="px-4 py-3">{campaign.status}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(campaign.spend, dashboard.currency)}
                    </td>
                    <td className="px-4 py-3">{campaign.leads}</td>
                    <td className="px-4 py-3">{campaign.conversions}</td>
                    <td className="px-4 py-3">
                      {campaign.spend === 0
                        ? "0.00x"
                        : `${(campaign.attributedRevenue / campaign.spend).toFixed(2)}x`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold">Efficiency ratios</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <dt className="text-zinc-500">CPC</dt>
                <dd className="mt-1 font-semibold">
                  {formatCurrency(dashboard.ratios.cpc, dashboard.currency)}
                </dd>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <dt className="text-zinc-500">CPM</dt>
                <dd className="mt-1 font-semibold">
                  {formatCurrency(dashboard.ratios.cpm, dashboard.currency)}
                </dd>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <dt className="text-zinc-500">Cost per lead</dt>
                <dd className="mt-1 font-semibold">
                  {formatCurrency(dashboard.ratios.costPerLead, dashboard.currency)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Ad accounts</h2>
            <div className="mt-4 space-y-3">
              {dashboard.accounts.map((account) => (
                <div
                  className="rounded-2xl border border-zinc-200 p-4 text-sm"
                  key={account.id}
                >
                  <p className="font-medium">{account.name}</p>
                  <p className="mt-1 text-zinc-600">{account.externalAccountId}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Last synced:{" "}
                    {account.lastSyncedAt
                      ? account.lastSyncedAt.toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Recent attribution events</h2>
          <div className="mt-5 space-y-3">
            {dashboard.recentAttributions.map((event) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
                key={event.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.customerName}</p>
                  <Badge tone="success">{event.confidence}</Badge>
                </div>
                <p className="mt-1 text-zinc-600">
                  {event.eventType} - {event.value ?? "No value"} - {event.eventTime}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {event.planName ?? "No subscription plan linked"}
                </p>
              </div>
            ))}
            {dashboard.recentAttributions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                No attributed conversions yet.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Latest insight rows</h2>
          <div className="mt-5 space-y-3">
            {dashboard.latestInsights.map((insight) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
                key={insight.id}
              >
                <p className="font-medium">{insight.campaignName}</p>
                <p className="mt-1 text-zinc-600">
                  {insight.adSetName} - {insight.adName}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {insight.date}: {insight.spend}, {insight.leads} leads,{" "}
                  {insight.conversions} conversions
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
