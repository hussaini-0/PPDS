# Testing Strategy

## Phase 1

- Unit tests for lead stage transitions.
- Unit tests for qualification scoring.
- Unit tests for plan recommendation rules.
- Unit tests for service-window validation.
- Unit tests for follow-up eligibility.
- Unit tests for subscription expiry calculations.
- Unit tests for payment approval/rejection eligibility.
- Unit tests for secure payment-proof file validation.
- Unit tests for analytics formula guards.
- Unit tests for broadcast audience eligibility, consent enforcement, and deduplication.
- Unit tests for Meta Ads ratios, insight summaries, and conversion payload generation.
- Unit tests for hardening checks around production secrets, Redis, and worker readiness.
- Unit tests for CMS content ranking and controlled WhatsApp bot replies.
- Public project enquiries validate contact details, consent, brief size, and allowed file types.

## Tooling

- `Vitest` for unit and integration tests.
- `Playwright` for critical end-to-end scenarios.

## Commands

- `npm run test`
- `npm run test:e2e`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run readiness:check`
