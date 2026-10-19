# Meta Ads Setup

## Required live configuration

- `META_GRAPH_API_VERSION`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`

## Sync approach

- Initial historical backfill
- Incremental daily sync
- Snapshot storage in `MetaDailyInsight`
- Mapping layer for account-specific result/action names
