# WhatsApp Setup

## Modes

- `INTEGRATION_MODE=mock` for local development
- `INTEGRATION_MODE=live` for real WhatsApp Cloud API traffic

## Required live configuration

- `META_GRAPH_API_VERSION`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`

Live webhook verification and signature validation will be handled by server route handlers and async event processing.
