# Security Review

## Scope

This review covers the MVP application code, mock/live integration boundaries, owner dashboard mutations, file uploads, webhooks, and background jobs.

## Implemented controls

- Auth.js credentials flow with role-aware permission matrix.
- Server-side session enforcement for dashboard pages and server actions.
- Approved-template-only broadcast messaging for bulk sends.
- Consent-aware broadcast audience filtering with opt-out enforcement.
- Webhook idempotency through persisted payload hashes.
- Payment proof MIME and size validation before storage.
- Non-guessable local storage keys for uploaded files.
- Audit logs for high-risk owner and automation mutations.
- Health endpoint reports database, Redis, security, and reliability checks.
- Redis-backed throttling protects sensitive writes across multiple web replicas and fails closed when Redis is unavailable in production.
- Live mode rejects mock WhatsApp and Meta mutation paths at the service layer.
- Production containers run as non-root users with dropped Linux capabilities and read-only filesystems where possible.
- Owner sessions use secure cookies in production and expire after eight hours.
- The first production owner is created by a one-time bootstrap that refuses to overwrite an existing owner.

## Production requirements still external

- Replace default `AUTH_SECRET` with a high-entropy secret.
- Serve `APP_URL` over HTTPS.
- Store live provider tokens in managed secret storage.
- Use S3-compatible private object storage for uploads.
- Configure provider webhook signatures/tokens in the hosting environment.
- Restrict dashboard access to trusted owner/admin accounts.

## Review outcome

The release artifact is hardened and builds successfully. Production launch remains blocked until live credentials, secret management, storage, domain/TLS, and managed runtime infrastructure are configured and the live smoke procedure passes.
