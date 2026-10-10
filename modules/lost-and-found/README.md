# Module 3 — Lost & Found Intelligence

## Overview

Module 3 provides the core domain logic, matching engine, state machine, and privacy enforcement for the Smart Campus Lost & Found ecosystem.

## Core Responsibilities

- **Multimodal Item Matching**: Combines visual features (CLIP), semantic text (MiniLM), categorical match, location proximity, and time decay into an empirical match score.
- **Strict State Lifecycle**: Centralized state transitions (`processing` -> `open` -> `in_claim` -> `handover` -> `resolved`).
- **Privacy by Design**: Masking of private descriptors, identifying marks, and sensitive images.
- **Consent-Controlled Contact Release**: Contact information is never exposed merely on match; only after explicit claim verification, approval, and within active contact windows.
- **Storage Abstraction**: Provider interface for safe file handling with non-guessable identifiers.

## Directory Structure

```text
src/
├── ai/            # AI service client with deterministic offline fallback
├── matching/      # Matching candidate filters
├── notifications/ # Event notification interfaces
├── privacy/       # Visibility and contact release rules
├── scoring/       # Multimodal score computation & matching-config.json
├── state/         # Finite state machine and legal transitions
├── storage/       # Storage provider interface and local adapter
├── validation/    # Zod contract input validators
└── index.ts       # Public API exports
```

## Running Tests

```bash
pnpm --filter @smart-campus/lost-and-found test
```

## Current Status

- ✅ Domain models and Zod contracts created in `@smart-campus/contracts`.
- ✅ Multimodal scoring and matching configuration initialized.
- ✅ State machine and transition validations tested.
- ✅ Privacy rules and redaction logic implemented and verified.
- ✅ Lost & Found UI/API workflow integrated: session-derived capabilities, owner
  match discovery, claimant answers, finder decisions, handover, personal reports,
  safe projections, and truthful processing/contact UX.
- ✅ FastAPI AI service is runnable in deterministic mock mode; the TypeScript AI
  client preserves the service's explicit mock/live provenance.
- ✅ Hosted-Supabase web processing path is available through the existing inline
  queue in `apps/web/lib/queue.ts`.
- ⏳ Full two-party browser acceptance remains to be completed.
- ⏳ Real model inference, durable external worker deployment, production image
  storage, notification delivery, and transactional multi-record writes remain
  production-hardening work.

## Current matching configuration

The values in `src/scoring/matching-config.json` are empirical similarity weights,
not ownership probabilities:

```text
image 0.20 · text 0.45 · category 0.15 · location 0.10 · time 0.10
high >= 0.75 · medium >= 0.50 · low < 0.50
```

## Current runtime notes

```text
Web:       http://localhost:3000
AI API:    http://127.0.0.1:8000
AI mode:   USE_MOCK_MODELS=true
```

For the complete architecture, setup, security, verification, and remaining-work
record, see `docs/progress/LOST_FOUND_HANDOFF.md` and
`docs/progress/MODULE_3_STATUS.md`.
