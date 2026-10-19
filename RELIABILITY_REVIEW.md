# Reliability Review

## Implemented controls

- Health endpoint checks PostgreSQL and Redis.
- BullMQ workers are split by responsibility: follow-ups, subscription lifecycle, and broadcasts.
- Broadcast jobs persist recipients before enqueueing so sends are restart-safe.
- Follow-up jobs persist database state before queue enqueueing.
- Webhook events are persisted and deduplicated before processing.
- Subscription lifecycle automation is idempotent by status/date checks.
- Analytics page exposes failed outbound messages and recent audit activity.

## Operational requirements

- Run one web process and separate worker processes:
  - `npm run worker:followups`
  - `npm run worker:subscriptions`
  - `npm run worker:broadcasts`
- Monitor `/api/health` for degraded database, Redis, security, or reliability checks.
- Alert on non-zero failed outbound messages.
- Alert on queue worker exits or repeated BullMQ failures.
- Back up PostgreSQL and uploaded proof storage.
- Put a trusted reverse proxy or managed ingress in front of the loopback-bound web container.
- Run `npm run smoke:production` after every release and alert when it fails.

## Verification status

Local PostgreSQL/Redis flows and all Linux release images have been verified. Live
reliability proof remains blocked until managed PostgreSQL, Redis, S3, DNS/TLS,
and WhatsApp credentials are configured in the production environment.
