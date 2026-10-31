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
- `WHATSAPP_PUBLIC_NUMBER`

Live webhook verification and signature validation will be handled by server route handlers and async event processing.

## Customer QR access

Set `WHATSAPP_PUBLIC_NUMBER` to `923458197950` (international format without spaces). Public support buttons then open the official `wa.me` conversation for +92 345 8197950.

This QR code does not connect a WhatsApp Web session. Production bot access continues to use the official WhatsApp Cloud API credentials and webhook configuration above.
