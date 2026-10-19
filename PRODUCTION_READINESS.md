# Production Readiness

## Phase 8 scope

Phase 8 closes the implementation plan beyond the original seven requested phases by adding deploy-readiness checks, request hardening, and an explicit definition-of-done status.

## Completed

- Sensitive API route rate limiting is shared through Redis and fails closed in production.
- Common browser security headers are applied to app and API responses.
- Production readiness validation is available through `npm run readiness:check`.
- Health checks already include database, Redis, security, and reliability status.
- Worker entrypoints exist for follow-ups, subscriptions, and broadcasts.
- WhatsApp live webhooks require Meta HMAC signatures.
- Outbound bot, owner, follow-up, and broadcast messages use the WhatsApp Cloud API in live mode.
- Production uploads support private S3-compatible object storage.
- An immutable initial Prisma migration and containerized release topology are included.
- A one-time, fail-safe production owner bootstrap command is included.
- Production containers run without Linux capabilities, with read-only filesystems where possible, bounded resources, log rotation, and graceful shutdown.
- Live smoke automation covers health, public pages, CMS access control, and the WhatsApp webhook verification handshake.
- The production dependency audit reports zero runtime vulnerabilities as of October 18, 2026.
- Security and reliability reviews document production controls and external blockers.

## Still externally blocked

- Live WhatsApp Business Cloud API credentials and webhook signature configuration.
- Live Meta Marketing API credentials and ad account access.
- Managed secret storage and production `AUTH_SECRET`.
- S3-compatible storage for payment proofs.
- Hosting configuration for separate web and worker processes.
- A domain and TLS certificate.
- Live Meta Ads API synchronization remains outside the verified release path.

## Final local verification commands

```bash
npm run readiness:check
npm run typecheck
npm run lint
npm run test
npm run build
```

## Definition-of-done status

The website, CMS, and WhatsApp messaging release path is implemented. Full end-to-end production proof remains blocked until PostgreSQL, Redis, S3, a domain, and live WhatsApp credentials are supplied and reachable.
