# Bot Behaviour

The bot is constrained by deterministic workflow rules. AI is advisory and language-focused only.

## Allowed AI tasks

- Intent detection
- Structured extraction
- Knowledge-grounded answer rephrasing
- Conversation summarisation
- Escalation suggestion
- Retrieval of published CMS products, development packages, timelines, pricing, and FAQs

## CMS grounding

- The bot searches only `PUBLISHED` products, development packages, and FAQs.
- Draft or archived CMS content is never included in a bot answer.
- Package prices are reported only when a starting price is explicitly stored.
- The bot invites owner escalation for quotations and custom decisions.

## Forbidden AI tasks

- Changing prices
- Approving payments
- Activating subscriptions
- Issuing refunds
- Sending unrestricted broadcasts
- Accessing secrets
