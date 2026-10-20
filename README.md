# PPDS

Digital-products and software-services storefront with website checkout, customer credential delivery, and a production-oriented WhatsApp operations platform.

## Product summary

- WhatsApp-first lead intake and conversation management
- Deterministic sales workflow with AI-constrained bot orchestration
- Manual payment-proof review before subscription activation
- Broadcast, attribution, and Meta Ads reporting workflows
- Public digital-product catalogue and software-development website
- Customer registration, website checkout, order tracking, and encrypted credential delivery
- Admin-managed payment methods, payment review, and storefront fulfillment
- Owner CMS for products, packages, FAQs, testimonials, pages, and enquiries
- WhatsApp bot answers grounded in published CMS content
- Mock mode for local development and live mode for official provider integrations

## Architecture

- Next.js 16 App Router with TypeScript
- PostgreSQL via Prisma
- Redis and BullMQ for background jobs
- Auth.js credentials flow with role scaffolding
- Modular monolith organized by business capability

See `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `IMPLEMENTATION_PLAN.md`, `WEBSITE_PLAN.md`, `SECURITY_REVIEW.md`, `RELIABILITY_REVIEW.md`, and `PRODUCTION_READINESS.md`.

## Local setup

1. Copy `.env.example` to `.env`.
2. Start infrastructure with `npm run db:up`.
3. Run `npm run prisma:generate`.
4. Run `npm run prisma:migrate`.
5. Run `npm run prisma:seed`.
6. Run `npm run dev`.

## Docker setup

- PostgreSQL and Redis are defined in `docker-compose.yml`.
- Use `npm run db:up` and `npm run db:down`.

## Seed credentials

- Email: `owner@example.com`
- Password: `OwnerPass123!`

These credentials are for local seeded development only.

## Commands

- Dev server: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Production readiness check: `npm run readiness:check`
- Production environment gate: `npm run readiness:production`
- Production dependency audit: `npm run security:audit`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate: `npm run prisma:migrate`
- Prisma seed: `npm run prisma:seed`
- Follow-up worker: `npm run worker:followups`
- Subscription lifecycle worker: `npm run worker:subscriptions`
- Broadcast worker: `npm run worker:broadcasts`

## Mock mode

- Set `INTEGRATION_MODE=mock`.
- Use seeded customers, leads, subscriptions, payments, campaigns, and conversations.
- The dashboard, inbox, payments, and broadcast screens read live data from the database-backed mock layer.
- The local seed creates published software packages, FAQs, and clearly labeled preview products. Review product commercial terms in `/dashboard/cms` before accepting live orders; sample testimonials remain drafts.
- Software services are presented on `/software-development` and intentionally excluded from the digital-product category catalogue.
- Product names, categories, prices, logos, card images, publication status, homepage visibility, and display order are managed in `/dashboard/cms`.
- Store payment methods, order verification, and credential assignment are managed in `/dashboard/orders`.
- Customer purchases and credentials are available only through `/account`; credentials are encrypted at rest with `ENCRYPTION_KEY` and are never sent through WhatsApp.
- Mark a published product as `Show in homepage hero` to place it in the opening section. The first five are selected by display order; archiving, unchecking the hero option, or deleting a product removes it from that placement.
- CMS media uploads accept PNG, JPEG, and WebP files up to 5 MB. Local development writes them to `public/uploads/products`; production uses the configured S3-compatible bucket and `PUBLIC_ASSET_BASE_URL`.

## Website CMS

- Staff authentication is available only at `/admin/login` and is not linked from the public storefront.
- Open `/dashboard/cms` with the seeded owner account.
- Create and publish categories, products, software packages, FAQs, testimonials, and editable page content.
- Review project enquiries and newsletter subscriptions.
- Only published CMS records appear publicly or become available to the WhatsApp bot.
- Import potential customers from CSV at `/dashboard/contacts`. Required headers are `name` and `phone`; optional headers are `email`, `city`, `notes`, `tags`, and `marketing_consent`.
- Imports normalize and deduplicate phone numbers, create `NEW` leads, and leave marketing consent disabled unless the CSV explicitly records consent.

## Website commerce

- Customers register or sign in at `/account` and buy a published product through `/checkout/[slug]`.
- Checkout payment options are configured by staff in `/dashboard/orders`; no bank or wallet details are hardcoded.
- Customers upload payment proof on the website. Staff review it, approve or reject it, and assign the purchased login, password, URL, or license key.
- Fulfilled credentials appear only in the authenticated customer portal and are encrypted in PostgreSQL.
- Automated card charging is not included until a payment gateway and its production credentials are selected.

## Live mode

- Set `INTEGRATION_MODE=live`.
- Provide official Meta and WhatsApp credentials through environment variables.
- Inbound webhooks are signature-verified and outbound bot, owner, follow-up, and broadcast messages use the WhatsApp Cloud API.
- Public WhatsApp links open the official business conversation; WhatsApp account connection and bot administration remain restricted to authenticated staff.
- Use `DEPLOYMENT.md` and `.env.production.example` for the release procedure.

## Known limitations as of October 18, 2026

- Iterations 1-8 now cover foundation, inbox/webhook flow, deterministic bot workflow, follow-up automation, payments, subscriptions, compliant broadcast campaigns, Meta Ads reporting, analytics, hardening, and production-readiness closure.
- Meta Ads dashboard sync and conversion-event sending remain mock implementations; do not represent them as live Meta Ads integration.
- Payment approval and subscription activation are implemented, but full runtime validation still requires a reachable PostgreSQL database.
- Follow-up, subscription lifecycle, and broadcast worker entrypoints are available through npm scripts.
- Local PostgreSQL and Redis migrations and application flows have been verified; production still requires separate managed services and production-only credentials.
- Health checks verify PostgreSQL, Redis, security configuration, and reliability expectations.
- Website checkout supports configurable manual bank or wallet payment methods with proof review. Automated card charging requires a payment-gateway integration.
