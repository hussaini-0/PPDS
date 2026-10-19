# Database Schema Plan

## Approach

The schema uses a single-tenant-ready `businessId` boundary on business-owned records, normalized relations, explicit enums, auditability, and idempotent webhook/event storage.

## Website CMS

- `ProductCategory` — public category navigation and product grouping.
- `Product` — digital-product descriptions, prices, discounts, features, and publication state.
- `DevelopmentPackage` — software scope, audience, timeline, revisions, support, and optional starting price.
- `CmsPage` — editable page titles, summaries, body content, and SEO fields.
- `Faq` — published customer answers and WhatsApp bot knowledge.
- `Testimonial` — verified-state customer statements with publication control.
- `ProjectInquiry` — detailed software briefs, preferred contact method, status, and optional uploaded file.
- `NewsletterSubscriber` — consented email subscriptions.

All public content uses `CmsPublicationStatus`: `DRAFT`, `PUBLISHED`, or `ARCHIVED`. Public pages and the WhatsApp bot query only `PUBLISHED` records.

## Phase 1 entities

- `Business`
- `User`
- `Customer`
- `Lead`
- `Conversation`
- `Message`
- `SubscriptionPlan`
- `Subscription`
- `Payment`
- `UploadedFile`
- `KnowledgeBaseEntry`
- `BotConversationState`
- `AutomationRule`
- `FollowUpJob`
- `WhatsAppTemplate`
- `BroadcastCampaign`
- `BroadcastRecipient`
- `MetaAdAccount`
- `MetaCampaign`
- `MetaAdSet`
- `MetaAd`
- `MetaDailyInsight`
- `AttributionEvent`
- `WebhookEvent`
- `AuditLog`
- `OwnerAttentionItem`
- `QualificationQuestion`
- `IntegrationSetting`

## Key schema rules

- Use E.164 normalized phone numbers with unique business-scoped indexes.
- Use `Decimal` for spend, revenue, and payment amounts.
- Persist external provider IDs where available for idempotency.
- Track lifecycle timestamps for lead, payment, and subscription state changes.
- Separate marketing consent from transactional subscription communication.
- Keep raw webhook and provider payloads in JSON columns with redaction at ingestion boundaries.
