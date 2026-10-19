# PPDS Website and CMS Plan

## Sitemap

- `/` — commerce and software-services homepage
- `/products` — searchable, category-filtered published catalogue
- `/products/[slug]` — product detail and WhatsApp purchase confirmation
- `/deals` — products with a valid comparison price
- `/software-development` — services, packages, process, and enquiry form
- `/project-request` — standalone detailed software brief
- `/about`, `/contact`, `/faqs`
- `/privacy`, `/terms`, `/refund-delivery`
- `/login` — client/owner authentication
- `/dashboard/*` — protected operations portal
- `/dashboard/cms` — protected website CMS and enquiry workspace

## Page Structure

The homepage moves from positioning to category discovery, products, software services, delivery process, trust, WhatsApp support, and package discovery. The software page explains four service lines, compares packages, describes delivery stages, explains human-controlled AI, and captures a detailed project brief.

## Design System

- Primary: deep navy `#07111f`
- Accent: amber and controlled emerald
- Surface: warm off-white `#f8f5ee`
- Typography: existing local display and sans stacks to avoid build-time font downloads
- Geometry: editorial spacing, strong typography, rounded 20–40px containers, restrained shadows
- Motion: CSS hover and transform transitions; no animation dependency or visual noise
- Accessibility: semantic landmarks, visible focus rings, labelled controls, high contrast, responsive layouts

## CMS Data Model

- `ProductCategory` groups products and controls public navigation.
- `Product` stores pricing, comparison price, features, badges, and publication status.
- `DevelopmentPackage` stores audience, scope, timeline, revisions, support, and optional starting price.
- `CmsPage` stores editable page titles, summaries, body content, and SEO fields.
- `Faq` provides public answers and approved bot knowledge.
- `Testimonial` distinguishes verified statements from draft sample content.
- `ProjectInquiry` stores software briefs and uploaded files.
- `NewsletterSubscriber` stores explicit subscription consent.

Every public CMS record uses `DRAFT`, `PUBLISHED`, or `ARCHIVED`. Only `PUBLISHED` products, packages, pages, FAQs, and testimonials are available to public pages or the WhatsApp bot.

## Implementation Phases

1. Extend the normalized Prisma schema and seed safe starter content.
2. Build shared CMS validation, queries, enquiry handling, and bot search logic.
3. Build the responsive public storefront and software-services pages.
4. Build the authenticated owner CMS and enquiry management workspace.
5. Connect the WhatsApp bot to published CMS information.
6. Add SEO routes, structured organization metadata, rate limits, tests, and production verification.

## Payment Boundary

The cart is enquiry-oriented. Product availability and manual payment instructions are confirmed through WhatsApp. No card gateway or automated financial approval was introduced.
