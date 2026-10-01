# Lost & Found Background Worker

## Overview

This standalone worker process handles asynchronous, compute-heavy tasks for the Lost & Found system to avoid blocking Next.js API route handlers.

## Handled Jobs

- `process-item`: Coordinates visual & text embedding extraction via the AI service and updates candidate matches.
- `explain-match`: Synthesizes user-facing reasoning for high/medium match recommendations.
- `send-notification`: Dispatches in-app, email, or SMS alerts for verified matches and claims.
- `claim-nudge` & `handover-nudge`: Periodically alerts parties to unattended claims or handovers.
- `expire-items`: Transitions stale open items to `expired` status.
- `close-contact-windows`: Shuts contact access windows once handovers complete or timeouts occur.

## Running the Worker

```bash
# In development
pnpm --filter @smart-campus/lost-found-worker dev

# Typechecking
pnpm --filter @smart-campus/lost-found-worker typecheck
```

## Current Status

- ✅ Process lifecycle and graceful shutdown (`SIGINT`, `SIGTERM`) handled.
- ✅ Job interfaces and dispatcher skeleton established.
- ⏳ Database job queue integration and real worker queue drivers to be wired during feature implementation.
