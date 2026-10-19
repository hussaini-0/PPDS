# Implementation Plan

## Current assessment

- [x] Repository inspected.
- [x] Existing architecture assessed.
- [x] Reusable starter code identified.
- [x] Greenfield implementation confirmed.

## Architecture summary

- [x] Next.js App Router application in `src/app`.
- [x] Domain modules under `src/modules`.
- [x] Shared server utilities under `src/server`.
- [x] Prisma schema and seed workflow under `prisma`.
- [x] Background workers isolated from web runtime.
- [x] Mock and live integration adapters behind common interfaces.

## Delivery phases

### Phase 1: Foundation

- [x] Create project scaffold.
- [x] Define Prisma foundation schema and enums.
- [x] Add Docker Compose for PostgreSQL and Redis.
- [x] Implement authentication and role model.
- [x] Implement core module structure for customers, leads, conversations, plans, settings.
- [x] Implement mock integration mode contracts.
- [x] Build owner dashboard shell with real server data.
- [x] Seed realistic local development data.
- [x] Run lint.
- [x] Run typecheck.
- [x] Run foundational tests.
- [ ] Run migrations and seed against a live local database.

### Phase 2: WhatsApp inbox

- [x] Webhook persistence and idempotency layer.
- [x] Inbox, thread, and message composer flows.
- [x] Human takeover controls.
- [x] Mock inbound message simulator.
- [x] Delivery and read status updates.

### Phase 3: Bot sales workflow

- [x] Knowledge base approval model.
- [x] Qualification engine.
- [x] Plan recommendation rules.
- [x] Bot orchestration service.
- [x] Follow-up scheduling and escalation.

### Phase 4: Payments and subscriptions

- [x] Payment-proof upload pipeline.
- [x] Verification queue.
- [x] Approval and rejection flow.
- [x] Subscription activation transaction.
- [x] Expiry and renewal automation.

### Phase 5: Broadcasts

- [x] Template sync and storage.
- [x] Consent-aware audience builder.
- [x] Broadcast queue and tracking.
- [x] Pause, cancel, and retry controls.

### Phase 6: Meta Ads

- [x] Meta account and insight sync.
- [x] Campaign reporting views.
- [x] Attribution services.
- [x] Optional conversions API events.

### Phase 7: Analytics and hardening

- [x] Funnel and revenue analytics.
- [x] Bot performance reporting.
- [x] Audit coverage completion.
- [x] Security review.
- [x] Reliability review.
- [x] Full test suite.
- [x] Documentation completion.

### Phase 8: Production readiness closure

- [x] Sensitive route rate limiting.
- [x] Security response headers.
- [x] Production readiness validation script.
- [x] Definition-of-done status document.
- [x] Final verification pass.

### Phase 9: Public website, CMS, and bot content integration

- [x] Public commerce and software-services website.
- [x] Searchable category-led product catalogue and product details.
- [x] Software services, package comparison, and project lifecycle content.
- [x] Detailed project enquiry form with validated brief uploads.
- [x] Owner CMS for products, packages, FAQs, testimonials, pages, and enquiries.
- [x] Draft/published/archived content lifecycle.
- [x] WhatsApp bot retrieval from published CMS content only.
- [x] Newsletter capture, SEO metadata, sitemap, robots, and policy routes.
- [x] Unit, lint, type, and production build verification.

## Open risks and prerequisites

- [ ] WhatsApp Business Cloud API credentials for live mode.
- [ ] Meta Marketing API credentials and ad account access for live mode.
- [ ] Production-grade secret management and encryption key.
- [ ] S3-compatible storage for production uploads.
- [ ] Background worker process deployment target.
- [ ] Local Docker daemon access for containerized PostgreSQL and Redis.
- [ ] Apply the extended CMS schema and run the updated seed after Docker/PostgreSQL becomes available.

## Completed in iterations 1-3

- [x] Local environment config, Prisma adapter setup, and offline-safe Next.js build.
- [x] WhatsApp webhook verification and receiver route handlers.
- [x] Mock inbound WhatsApp simulator route and dashboard form.
- [x] Conversation detail API, manual messaging API, and takeover API.
- [x] Inbox UI upgraded from placeholder to actionable thread view.
- [x] Deterministic qualification, plan recommendation, payment-instruction, and payment-proof acknowledgement flow.
- [x] Follow-up scheduling, cancellation, eligibility checks, and BullMQ worker entrypoint.
- [x] Explicit owner escalation for sensitive or manually handled conversations.

## Still incomplete after iterations 1-3

- [ ] Docker-backed database and Redis runtime verification on this machine.

## Completed in Phase 4

- [x] Manual payment-proof upload with MIME and size validation.
- [x] Owner verification queue with approve, reject, and request-clarification actions.
- [x] Transactional payment approval that verifies payment, activates subscription, converts lead, cancels follow-ups, records attribution, sends confirmation, resolves attention items, and writes audit logs.
- [x] Payment rejection flow that preserves manual review context and avoids subscription activation.
- [x] Subscription dashboard for active, expiring, expired, cancelled, paused, and pending states.
- [x] Subscription lifecycle job and worker command for expiring/expired status updates.

## Completed in Phase 5

- [x] Approved-template-only broadcast campaign creation.
- [x] Consent-aware audience filtering with exclusions for opt-outs, missing consent, invalid phone numbers, stale/recency rules, plan mismatch, Meta campaign mismatch, tag mismatch, lead-stage mismatch, and subscription-status mismatch.
- [x] Recipient row creation with personalized template variables and duplicate protection.
- [x] BullMQ broadcast worker entrypoint with scheduled execution and safe restart behavior.
- [x] Campaign schedule, pause, cancel, and manual run controls in the owner dashboard.
- [x] Delivery/read/failure webhook status propagation from WhatsApp messages to broadcast recipients and aggregate campaign metrics.

## Completed in Phase 6

- [x] Meta Ads dashboard with 30-day spend, lead cost, CTR, CPC, CPM, attributed revenue, and ROAS.
- [x] Campaign-level reporting that joins Meta insights with attributed subscription conversions.
- [x] Mock Meta insight sync action that upserts daily ad-level rows and records audit history.
- [x] Attribution event reporting for recent WhatsApp-to-subscription conversions.
- [x] Mock Conversions API dispatch that records generated Meta payloads on attribution events.

## Completed in Phase 7

- [x] Analytics dashboard for lead funnel, revenue, renewal risk, bot escalation, failed outbound messages, revenue events, and audit trail.
- [x] Additional analytics formula tests for funnel drop-off, ARPU, renewal risk, and bot escalation.
- [x] Hardening checks for auth secret, HTTPS app URL, integration mode, database, Redis, and worker deployment expectations.
- [x] Health endpoint extended with security and reliability hardening results.
- [x] Security and reliability review documents added.
- [x] Full static/unit verification completed.

## Completed in Phase 8

- [x] Added proxy-level rate limiting for authentication, mock WhatsApp ingestion, WhatsApp webhooks, conversation message sending, and human takeover endpoints.
- [x] Added security headers for content type protection, clickjacking protection, referrer policy, and browser permissions policy.
- [x] Added `npm run readiness:check` to validate required docs, environment placeholders, and operational scripts.
- [x] Added `PRODUCTION_READINESS.md` with completed controls, external blockers, and final verification commands.

## Completed in Phase 9

- [x] Replaced the root dashboard redirect with a premium PPDS public website.
- [x] Added product, deals, software development, project request, about, contact, FAQ, cart, and policy pages.
- [x] Added normalized CMS and enquiry models to Prisma with safe publication states.
- [x] Added an authenticated `/dashboard/cms` workspace and CMS audit logging.
- [x] Connected project enquiries to uploaded briefs and the owner attention queue.
- [x] Connected the WhatsApp bot to published products, software packages, and FAQs.
- [x] Kept demo products and testimonials unpublished until commercial verification.
