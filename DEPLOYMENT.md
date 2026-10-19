# Production Deployment

## Release topology

Deploy one immutable image with separate targets/processes:

- `web`: Next.js standalone server on port 3000.
- `migrate`: one-shot `prisma migrate deploy` release task.
- `followups`: BullMQ follow-up worker.
- `broadcasts`: BullMQ broadcast worker.
- `subscriptions`: scheduled subscription lifecycle worker.
- Managed PostgreSQL, Redis, and a private S3-compatible bucket.

`compose.production.yml` models this topology. The application does not bundle PostgreSQL or Redis into the production file because those services require managed backups, encryption, monitoring, and failover.

## Required configuration

1. Copy `.env.production.example` to `.env.production` outside source control.
2. Replace every placeholder with production values.
3. Use `rediss://` and PostgreSQL TLS where the providers support them.
4. Keep the S3 bucket private; grant the runtime only object read/write permissions for that bucket.
5. Generate independent high-entropy values for `AUTH_SECRET`, `ENCRYPTION_KEY`, and `WHATSAPP_VERIFY_TOKEN`.
6. Run `npm run readiness:production`. Deployment must stop if it fails.

Production validation deliberately requires PostgreSQL TLS, Redis TLS, live
integrations, HTTPS, public product-media delivery, and non-placeholder secrets.

## Release procedure

```bash
npm ci
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run security:audit
npm run build
npm run readiness:production
docker compose -f compose.production.yml build
docker compose -f compose.production.yml up -d
npm run smoke:production
```

The migration container must complete successfully before web traffic or workers start. Do not run the development seed against production.

Create the first owner exactly once after migrations. Supply these values through
your secret runner for this command only; do not save the password in the production
environment file:

```bash
BOOTSTRAP_OWNER_EMAIL=owner@your-domain.com \
BOOTSTRAP_OWNER_PASSWORD='a-unique-14+-character-password' \
BOOTSTRAP_OWNER_NAME='Account owner' \
BOOTSTRAP_BUSINESS_NAME='Prime Plus Digital Services' \
npm run bootstrap:owner
```

The command refuses to run if any owner already exists and records an audit event.
Remove the bootstrap variables immediately after it succeeds.

## WhatsApp configuration

- Set the callback URL to `https://YOUR_DOMAIN/api/webhooks/whatsapp`.
- Use the exact `WHATSAPP_VERIFY_TOKEN` from the production secret store.
- Subscribe to message and message-status events.
- `META_APP_SECRET` validates `X-Hub-Signature-256` on every live webhook.
- `META_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are used for outbound text and approved-template messages.
- Run a real inbound message, bot reply, owner reply, follow-up, and approved-template broadcast before launch.
- `npm run smoke:production` validates the public pages, health dependencies, CMS authentication boundary, and WhatsApp webhook verification handshake. A real phone-to-bot message remains a required manual provider test.

## Go-live checks

- `/api/health` returns HTTP 200 and reports PostgreSQL, Redis, security, and reliability as healthy.
- `/`, `/products`, `/software-development`, `/project-request`, `/login`, and `/dashboard/cms` load over HTTPS.
- A project enquiry is stored and visible in the CMS.
- Published CMS content is visible publicly and answerable by the WhatsApp bot.
- Uploads land in the private bucket, not the container filesystem.
- Worker logs show successful Redis connections and no restart loop.
- Database backups, object retention, uptime alerts, and worker-exit alerts are enabled.

## Rollback

Redeploy the previous immutable image. Prisma migrations in this repository are forward-only; prepare and test an explicit corrective migration instead of editing or deleting an applied migration. Restore data only from a verified backup when a schema rollback cannot preserve it.
