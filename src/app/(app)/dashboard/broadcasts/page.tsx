import { LeadStage, SubscriptionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { previewBroadcastAudience } from "@/modules/broadcasts/service";
import { requireSession } from "@/modules/auth/session";

import {
  cancelCampaignAction,
  createCampaignAction,
  pauseCampaignAction,
  runCampaignNowAction,
  scheduleCampaignAction,
  sendTestBroadcastAction,
} from "./actions";

export default async function BroadcastsPage() {
  const session = await requireSession();
  const [campaigns, templates, plans, metaCampaigns] = await Promise.all([
    prisma.broadcastCampaign.findMany({
      where: { businessId: session.user.businessId },
      include: {
        template: true,
        recipients: {
          include: { customer: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.whatsAppTemplate.findMany({
      where: { businessId: session.user.businessId, status: "APPROVED" },
      orderBy: { name: "asc" },
    }),
    prisma.subscriptionPlan.findMany({
      where: { businessId: session.user.businessId, isActive: true },
      orderBy: { recommendationPriority: "desc" },
    }),
    prisma.metaCampaign.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultTemplate = templates[0];
  const preview = defaultTemplate
    ? await previewBroadcastAudience({
        businessId: session.user.businessId,
        templateId: defaultTemplate.id,
        audienceFilter: {
          segment: "ACTIVE_SUBSCRIBERS",
          requireMarketingConsent: true,
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold">Create compliant broadcast</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Bulk sends require an approved template and consent-safe audience.
            </p>
          </div>

          <form action={createCampaignAction} className="grid gap-3">
            <input
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="name"
              placeholder="Campaign name"
              required
            />
            <select
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="templateId"
              required
            >
              <option value="">Approved template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.language})
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="segment"
              required
            >
              <option value="ACTIVE_SUBSCRIBERS">Active subscribers</option>
              <option value="EXPIRING_SUBSCRIBERS">Expiring subscribers</option>
              <option value="EXPIRED_SUBSCRIBERS">Expired subscribers</option>
              <option value="LEADS_BY_STAGE">Leads by stage</option>
              <option value="PAYMENT_INSTRUCTIONS_NO_PROOF">
                Payment instructions, no proof
              </option>
              <option value="META_CAMPAIGN">Meta campaign leads</option>
              <option value="CUSTOMER_TAGS">Customer tags</option>
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                name="planId"
              >
                <option value="">Any selected plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                name="metaCampaignId"
              >
                <option value="">Any Meta campaign</option>
                {metaCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="tags"
              placeholder="Tags, comma-separated"
            />
            <input
              name="leadStages"
              type="hidden"
              value={[
                LeadStage.INTERESTED,
                LeadStage.PLAN_RECOMMENDED,
                LeadStage.PAYMENT_INSTRUCTIONS_SENT,
              ].join(",")}
            />
            <input
              name="subscriptionStatuses"
              type="hidden"
              value={[SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRING].join(",")}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Created from
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-zinc-900"
                  name="createdFrom"
                  type="date"
                />
              </label>
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Created to
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-zinc-900"
                  name="createdTo"
                  type="date"
                />
              </label>
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Not contacted since
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-zinc-900"
                  name="notContactedSince"
                  type="date"
                />
              </label>
            </div>
            <input
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              name="scheduledAt"
              type="datetime-local"
            />
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                className="size-4"
                defaultChecked
                name="requireMarketingConsent"
                type="checkbox"
              />
              Require explicit marketing consent
            </label>
            <button
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
              type="submit"
            >
              Create draft with eligible recipients
            </button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold">Audience preview</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Default preview: active subscribers, consent required, first approved
              template.
            </p>
            {preview ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-2xl font-semibold text-emerald-800">
                    {preview.eligible.length}
                  </p>
                  <p className="text-sm text-emerald-700">Eligible recipients</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-2xl font-semibold text-amber-800">
                    {preview.excluded.length}
                  </p>
                  <p className="text-sm text-amber-700">Excluded with reasons</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-medium">Sample exclusions</p>
                  <div className="space-y-2">
                    {preview.excluded.slice(0, 4).map((recipient) => (
                      <div
                        className="rounded-xl border border-zinc-200 p-3 text-sm"
                        key={recipient.customerId}
                      >
                        <p className="font-medium">{recipient.customerName}</p>
                        <p className="text-xs text-zinc-500">
                          {recipient.reasons.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                Add an approved WhatsApp template before creating campaigns.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Send test</h2>
            <form action={sendTestBroadcastAction} className="mt-4 space-y-3">
              <select
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                name="templateId"
                required
              >
                <option value="">Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                name="phoneNumber"
                placeholder="+923001234567"
                required
              />
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                name="customerName"
                placeholder="Customer name"
              />
              <button
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium"
                type="submit"
              >
                Send test message
              </button>
            </form>
          </Card>
        </div>
      </section>

      <Card>
        <h2 className="text-xl font-semibold">Campaign history</h2>
        <div className="mt-5 space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{campaign.name}</p>
                    <Badge
                      tone={
                        campaign.status === "COMPLETED"
                          ? "success"
                          : campaign.status === "FAILED" ||
                              campaign.status === "CANCELLED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {campaign.template.name} ({campaign.template.language}) -{" "}
                    {campaign.scheduledAt
                      ? `scheduled ${formatDate(campaign.scheduledAt)}`
                      : "manual schedule"}
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-6">
                    <div>
                      <dt className="text-xs text-zinc-500">Total</dt>
                      <dd className="font-medium">{campaign.totalRecipients}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Sent</dt>
                      <dd className="font-medium">{campaign.sentCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Delivered</dt>
                      <dd className="font-medium">{campaign.deliveredCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Read</dt>
                      <dd className="font-medium">{campaign.readCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Failed</dt>
                      <dd className="font-medium">{campaign.failedCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Converted</dt>
                      <dd className="font-medium">{campaign.convertedCount}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  {campaign.status === "DRAFT" || campaign.status === "PAUSED" ? (
                    <form action={scheduleCampaignAction}>
                      <input name="campaignId" type="hidden" value={campaign.id} />
                      <button
                        className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                        type="submit"
                      >
                        Schedule
                      </button>
                    </form>
                  ) : null}
                  {campaign.status === "SCHEDULED" ||
                  campaign.status === "RUNNING" ? (
                    <form action={pauseCampaignAction}>
                      <input name="campaignId" type="hidden" value={campaign.id} />
                      <button
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium"
                        type="submit"
                      >
                        Pause
                      </button>
                    </form>
                  ) : null}
                  {campaign.status === "SCHEDULED" ? (
                    <form action={runCampaignNowAction}>
                      <input name="campaignId" type="hidden" value={campaign.id} />
                      <button
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium"
                        type="submit"
                      >
                        Run now
                      </button>
                    </form>
                  ) : null}
                  {["DRAFT", "SCHEDULED", "PAUSED", "RUNNING"].includes(
                    campaign.status,
                  ) ? (
                    <form action={cancelCampaignAction}>
                      <input name="campaignId" type="hidden" value={campaign.id} />
                      <button
                        className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700"
                        type="submit"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              {campaign.recipients.length > 0 ? (
                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  {campaign.recipients.map((recipient) => (
                    <div
                      className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600"
                      key={recipient.id}
                    >
                      <p className="font-medium text-zinc-900">
                        {recipient.customer.fullName}
                      </p>
                      <p>{recipient.status}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
              No broadcast campaigns created yet.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
