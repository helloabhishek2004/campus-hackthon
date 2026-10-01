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
- ⏳ Real background processing worker and FastAPI AI service are established as skeletons.
