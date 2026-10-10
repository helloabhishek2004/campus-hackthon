# Inter-Module Integration Status

This document tracks the integration milestones across the three parallel development streams of the Smart Campus system.

## Current update — 2026-10-09

The detailed Module 3 handoff is maintained in:

```text
docs/progress/LOST_FOUND_HANDOFF.md
docs/progress/MODULE_3_STATUS.md
```

Module 3 is now an **Integrated Hackathon System**. Its UI, server capabilities,
verification workflow, finder decisions, and claimant handover are connected to
the existing persistence and state machine. No shared identity, migration, RLS,
or unrelated module architecture was replaced.

---

## Overall Integration Overview

| Module Stream                         | Owner       | Integration Boundary                              | Current Status                                            |
| :------------------------------------ | :---------- | :------------------------------------------------ | :-------------------------------------------------------- |
| **Module 1 (Campus Portal)**          | Developer A | `apps/web/`                                       | Operational; institutional session used by Module 3      |
| **Module 2 (Complaint Intelligence)** | Developer B | `modules/complaint-intelligence`                  | Operational; Public contract `analyzeComplaint` verified  |
| **Module 3 (Lost & Found)**           | Developer C | `modules/lost-and-found`, `workers/`, `services/` | Integrated hackathon workflow; browser acceptance pending |

---

## Module 3 Integration Checkpoints

- [x] **Contract Standardization**: Data structures defined in `@smart-campus/contracts/lost-and-found`.
- [x] **Database Migration**: Schema defined in `supabase/migrations/002_lost_and_found.sql` preserving canonical user references.
- [x] **Domain Logic & State Machine**: Implemented and unit tested in `modules/lost-and-found`.
- [x] **Web App Route Boundaries**: Page skeletons under `/lost-and-found/*` and API routes under `/api/lost-found/*`.
- [x] **Async AI & Worker Infrastructure**: Skeletons for `services/lost-found-ai` and `workers/lost-found-worker`.
- [x] **Live persistence/matching integration**: Hosted Supabase processing path stores embeddings, scores, matches, and events; the score remains a weighted empirical heuristic rather than a probability.
- [x] **Full Claim & Handover UI**: Session-derived owner/finder capabilities, verification answers, finder decision, claimant handover, conflict refresh, and truthful contact instructions are connected to the existing backend state machine.
- [ ] **End-to-End Multimodal Verification**: API and service smoke checks pass; complete two-party browser verification from report submission -> embedding -> match -> claim -> handover remains pending.

## Current integration boundaries

- Institutional identity remains the single source of truth. The client reads
  `/api/auth/session`; server routes independently resolve identity and authorize.
- Public projections remain privacy-safe. Capability flags communicate allowed
  relationships without re-exposing ownership identifiers.
- The active hosted web flow uses the inline queue in `apps/web/lib/queue.ts`.
  The standalone pg-boss worker is an optional deployment path and requires a
  running PostgreSQL instance.
- The local FastAPI AI service is operational in deterministic mock mode at
  `127.0.0.1:8000`; its `isMock` provenance is preserved by the TypeScript client.
- Full local Supabase is optional for hosted development. Docker and the CLI are
  installed, but the current long-running shell may need a session refresh for
  `docker` group permissions before `supabase start` can run.
