# Architecture Assessment

## Current repository state

The repository was effectively empty. There was no existing application code, no Git history in the workspace root, and no reusable domain implementation. The only reusable asset was the generated Next.js baseline scaffold created for this phase.

## Target architecture

This MVP is being implemented as a modular monolith with clear boundaries so it can evolve into multi-tenant SaaS later without a rewrite.

```mermaid
flowchart LR
    UI["Next.js App Router Admin UI"] --> API["Route Handlers / Server Actions"]
    API --> Services["Domain Services"]
    Services --> Prisma["Prisma + PostgreSQL"]
    Services --> Queue["BullMQ + Redis"]
    Services --> Files["Storage Provider"]
    Services --> AI["AI Provider Adapter"]
    Services --> WA["WhatsApp Provider Adapter"]
    Services --> Meta["Meta Ads Adapter"]
    WA --> Webhooks["Webhook Persistence + Async Processing"]
    Meta --> Webhooks
    Webhooks --> Queue
```

## Public website and CMS extension

The public site and owner portal remain one modular Next.js application. Public routes read only published CMS records. The protected `/dashboard/cms` workspace writes draft and published content through server actions. Project enquiries enter the owner attention queue. The WhatsApp bot queries the same CMS service used by the storefront, so product and package answers share one controlled source of truth.

```mermaid
flowchart LR
    Visitor["Website visitor"] --> Public["Public storefront"]
    Public --> CMS["Published CMS records"]
    Owner["Authenticated owner"] --> Admin["CMS workspace"]
    Admin --> CMS
    WhatsApp["WhatsApp lead"] --> Bot["Bot orchestration"]
    Bot --> CMS
    Public --> Inquiry["Project enquiry"]
    Inquiry --> Attention["Owner attention queue"]
```

## Reusable starter code

- App Router scaffold in `src/app`
- TypeScript configuration
- Tailwind v4 baseline
- ESLint configuration

## Proposed folder structure

```text
src/
  app/
    (app)/
    api/
    login/
  components/
    dashboard/
    forms/
    layout/
    ui/
  config/
  lib/
  modules/
    analytics/
    audit/
    auth/
    bot/
    broadcasts/
    conversations/
    customers/
    dashboard/
    integrations/
    knowledge-base/
    leads/
    meta-ads/
    payments/
    plans/
    settings/
    subscriptions/
  server/
    db/
    jobs/
    queue/
    storage/
    webhooks/
  types/
  tests/
prisma/
worker/
docs/
```

## Phase 1 implementation decisions

- Use Auth.js credentials auth for the seeded single-owner workflow.
- Use Prisma with PostgreSQL decimals and enums for normalized core models.
- Use BullMQ with Redis queues, but keep worker runtime decoupled from web handlers.
- Use mock integration adapters selected by `INTEGRATION_MODE`.
- Build operational dashboard pages from database-backed server components, not hard-coded placeholder cards.
- Keep live integrations behind interfaces so mock mode remains first-class.

## External prerequisites

- PostgreSQL and Redis available locally through Docker Compose.
- Live WhatsApp Cloud API credentials.
- Live Meta Marketing API credentials.
- AI provider credentials for production bot features.
- Encryption key for sensitive integration settings.
