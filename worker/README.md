# Worker Runtime

This folder is reserved for BullMQ workers that will process:

- webhook ingestion jobs
- follow-up automation jobs
- broadcast send jobs

Run follow-up processing with:

```bash
npm run worker:followups
```

Phase 3 includes the follow-up processor. Later phases add webhook, broadcast, and subscription renewal processors.
