# 🎓 Smart Campus — Module Presentation
### Lost & Found Intelligence + Emergency Alert System

> **Hackathon Presentation Document**  
> Author: Adarsh | Smart Campus Monorepo — `modules/`

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Module 3 — Lost & Found Intelligence](#module-3--lost--found-intelligence)
3. [Emergency Alert Module](#emergency-alert-module)
4. [Tech Stack](#tech-stack)
5. [Architecture Diagram](#architecture-diagram)

---

## Project Overview

Smart Campus is a **pnpm monorepo** built with Next.js + Supabase + Gemini AI. It gives students, faculty, and security officers a unified platform to:

- 🔍 **Report and recover lost items** with AI-powered matching
- 🚨 **Report and broadcast campus emergencies** with priority scoring and approval gates
- 🔐 **Maintain privacy** — phone numbers masked, sensitive data never leaked to the browser

---

## Module 3 — Lost & Found Intelligence

> **Location:** `modules/lost-and-found/`

This module contains the **entire domain brain** for the Lost & Found system. It is a pure TypeScript library — no React, no DOM — consumed by the Next.js web app via `@smart-campus/contracts`.

---

### 📁 Directory Structure

```
modules/lost-and-found/
├── src/
│   ├── ai/            → AI service client (text + image embeddings)
│   ├── scoring/       → Multimodal match scoring engine
│   ├── matching/      → Candidate pair evaluation
│   ├── state/         → Finite State Machine (item lifecycle)
│   ├── privacy/       → Viewer-based redaction & contact release rules
│   ├── notifications/ → Notification types and dispatcher interface
│   ├── storage/       → File storage abstraction layer
│   ├── validation/    → Zod-powered input validators
│   └── index.ts       → Public API surface
├── tests/             → Vitest unit tests (scoring, state, privacy, validation)
└── data/db.json       → Local JSON database for development/demo
```

---

### 🧠 1. Multimodal Match Scoring Engine

**Files:** [`src/scoring/scoring.ts`](./src/scoring/scoring.ts) · [`src/scoring/matching.ts`](./src/scoring/matching.ts) · [`src/scoring/matching-config.json`](./src/scoring/matching-config.json)

When a new item is reported, the engine computes a **multi-signal similarity score** between every lost item and every found item using 5 independent signals:

| Signal     | Weight | Source                             |
|------------|--------|------------------------------------|
| `image`    | 20%    | CLIP (clip-ViT-B-32) embedding     |
| `text`     | 45%    | MiniLM-L6-v2 semantic embedding    |
| `category` | 15%    | Category exact/fuzzy match         |
| `location` | 10%    | Campus location proximity          |
| `time`     | 10%    | Time-of-report closeness / decay   |

The `calculateMatchScore()` function clamps all signals to `[0, 1]`, applies the weighted sum, and classifies the result into one of three **match bands**:

| Band     | Threshold | Label           |
|----------|-----------|-----------------|
| `high`   | ≥ 0.75    | Strong match    |
| `medium` | ≥ 0.50    | Possible match  |
| `low`    | < 0.50    | Unlikely match  |

`evaluateCandidateMatches()` then processes a batch of `CandidatePair[]` and returns structured `MatchResult[]` objects ready for storage.

---

### 🔄 2. Item Lifecycle — Finite State Machine

**Files:** [`src/state/state.ts`](./src/state/state.ts) · [`src/state/transitions.ts`](./src/state/transitions.ts)

Every reported item follows a **strict, validated state machine**. No item can jump to an invalid state — the engine throws an `IllegalStateTransitionError` if a transition is attempted illegally.

```
                  ┌──────────────┐
                  │  processing  │ ← Item just submitted
                  └──────┬───────┘
                         │ verified
                         ▼
                     ┌───────┐
              ┌─────▶│ open  │◀──────────┐
              │      └───┬───┘           │
              │          │ match claimed │
              │          ▼               │
              │      ┌──────────┐        │
              │      │ in_claim │────────┘ (claim rejected → re-open)
              │      └────┬─────┘
              │           │ approved
              │           ▼
              │       ┌──────────┐
              │       │ handover │ ← Physical handover in progress
              │       └────┬─────┘
              │            │ confirmed
              │            ▼
              │        ┌──────────┐
              │        │ resolved │ ✅
              │        └──────────┘
              │
         ┌────┴──────┐
         │  expired  │ ← Auto-expired by cron
         └───────────┘
         ┌────────────┐
         │ withdrawn  │ ← Reporter withdrew
         └────────────┘
```

**Legal transitions defined:**

```typescript
processing → open | withdrawn
open       → in_claim | expired | withdrawn
in_claim   → handover | open | withdrawn
handover   → resolved | open | in_claim
resolved   → (terminal)
expired    → open | withdrawn
withdrawn  → (terminal)
```

---

### 🔐 3. Privacy Engine

**File:** [`src/privacy/privacy.ts`](./src/privacy/privacy.ts)

The privacy module enforces **role-aware data redaction** before any item data reaches the client:

#### Item Sanitization
`sanitizeItemForViewer(item, viewer)` strips private data based on who is asking:

| Viewer Role                      | Sees Private Description | Sees Identifying Marks | Sees Sensitive Images |
|----------------------------------|:------------------------:|:----------------------:|:--------------------:|
| Reporter (owner)                 | ✅ Yes                   | ✅ Yes                 | ✅ Yes               |
| Admin / Security Officer         | ✅ Yes                   | ✅ Yes                 | ✅ Yes               |
| Other students / public          | ❌ No (null)             | ❌ No (null)           | ❌ Filtered out      |

The raw `storage_path` (internal bucket URL) is **always** stripped from images, regardless of role.

#### Contact Release Gate
`canReleaseContactInfo(viewer, claim, contactWindowExpiry)` enforces **5 layered rules** before contact details are exchanged:

1. **Claim must be `approved`** — a mere match is NOT sufficient
2. **Viewer must be a party** — either the claimant or the finder
3. **Security-mediated handover** blocks direct contact exchange
4. **Contact window must not have expired** (time-limited release)
5. **Admins and security officers** always have audit access

---

### 🤖 4. AI Service Client

**File:** [`src/ai/client.ts`](./src/ai/client.ts)

`LostFoundAIServiceClient` communicates with a **FastAPI Python ML service** to extract:
- `textEmbedding` — 384-dimensional vector via `all-MiniLM-L6-v2`
- `imageEmbedding` — 512-dimensional vector via `clip-ViT-B-32`
- `detectedObjects` — object labels with confidence scores
- `suggestedCategory` — AI-suggested item category

**Offline Fallback Mode:** If the Python service is unreachable, the client automatically falls back to a `generateDeterministicMock()` that produces pseudo-deterministic vectors based on the item title length. This ensures the rest of the pipeline continues working without the ML service.

---

### ✅ 5. Input Validation (Zod)

**File:** [`src/validation/index.ts`](./src/validation/index.ts)

All incoming API data is validated using **Zod schemas** from `@smart-campus/contracts` before reaching any business logic:

- `validateCreateLostItem(input)` → validates lost item report submissions
- `validateCreateFoundItem(input)` → validates found item report submissions
- `validateClaimDecision(input)` → validates claim approval/rejection decisions

Each validator returns a discriminated union (`ValidationSuccess<T> | ValidationFailure`) with structured error paths.

---

### 🔔 6. Notification System

**File:** [`src/notifications/index.ts`](./src/notifications/index.ts)

The notification system supports 7 event types:

| Event Type           | Triggered When                              |
|----------------------|---------------------------------------------|
| `match_found`        | A potential match is detected               |
| `claim_filed`        | A user files a claim on an item             |
| `claim_approved`     | Admin approves a claim                      |
| `claim_rejected`     | Admin rejects a claim                       |
| `questions_requested`| Verification questions sent to claimant     |
| `handover_scheduled` | Physical handover meeting arranged          |
| `contact_released`   | Contact details unlocked for both parties   |

The `NotificationDispatcher` interface is provider-agnostic — the `InAppNotificationDispatcher` writes to `public.lost_found_notifications` in Supabase.

---

### 🌐 Web UI Routes (in `apps/web/`)

| Route | Description |
|-------|-------------|
| `/lost-and-found` | Home — report or browse |
| `/lost-and-found/report/lost` | Report a lost item |
| `/lost-and-found/report/found` | Report a found item |
| `/lost-and-found/browse` | Browse all open items |
| `/lost-and-found/items/[id]` | Item detail page |
| `/lost-and-found/matches/[id]` | View a match |
| `/lost-and-found/claims/[id]` | Manage a claim |
| `/lost-and-found/my-reports` | User's own reports |
| `/lost-and-found/admin` | Admin panel |
| `/lost-and-found/success` | Post-submission success page |

### 🔌 API Routes (in `apps/web/api/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/lost-found/items` | GET / POST | List or create items |
| `/api/lost-found/items/[id]` | GET / PATCH / DELETE | Single item CRUD |
| `/api/lost-found/items/[id]/matches` | GET | Fetch matches for item |
| `/api/lost-found/items/[id]/check-matches` | POST | Trigger match check |
| `/api/lost-found/items/[id]/status` | PATCH | Update item status |
| `/api/lost-found/claims/[id]/decide` | POST | Approve or reject claim |
| `/api/lost-found/claims/[id]/answer` | POST | Answer verification questions |
| `/api/lost-found/claims/[id]/contact` | GET | Release contact details |
| `/api/lost-found/claims/[id]/handover` | POST | Confirm handover |
| `/api/lost-found/matches/[id]/claim` | POST | File a claim on match |
| `/api/lost-found/matches/[id]/dismiss` | POST | Dismiss a match |
| `/api/lost-found/admin` | GET | Admin dashboard data |
| `/api/lost-found/admin/logs` | GET | Audit logs |
| `/api/lost-found/admin/crons/expire` | POST | Expire old items (cron) |
| `/api/lost-found/admin/crons/windows` | POST | Close contact windows (cron) |

---

### 🧪 Test Coverage

Tests live in `modules/lost-and-found/tests/` using **Vitest**:

| Test Suite | File |
|------------|------|
| Scoring engine (weighted score, band classification) | `tests/scoring/scoring.test.ts` |
| State machine (legal & illegal transitions) | `tests/state/transitions.test.ts` |
| Privacy engine (redaction, contact release rules) | `tests/privacy/privacy.test.ts` |
| Input validation (Zod schema conformance) | `tests/validation/validation.test.ts` |

---

---

## Emergency Alert Module

> **Location:** `modules/emergency/`

A standalone **Next.js application** (within the monorepo) that provides the campus emergency reporting and alert broadcasting infrastructure.

---

### 📁 Directory Structure

```
modules/emergency/
├── app/
│   ├── page.tsx              → Emergency report submission form
│   ├── dashboard/page.tsx    → Alert Composer UI (admin)
│   └── api/alert/route.ts   → Alert broadcast API endpoint
├── lib/emergency/
│   ├── priority.ts           → Rule-based + ML priority scoring
│   ├── locations.ts          → Fuzzy location extraction from text
│   ├── approvals.ts          → Multi-approver gate logic
│   └── emergency-config.json → Keyword lists, cluster config, ACK timers
├── ai-service/
│   └── emergency.py          → FastAPI ML service (type classification)
└── schema.sql                → Full Supabase database schema
```

---

### 🚨 1. Priority Scoring Engine

**File:** [`lib/emergency/priority.ts`](./lib/emergency/priority.ts)

Every incoming emergency report gets a **priority level from 1 (most critical) to 4 (low urgency)**. Priority is computed in two layers:

#### Base Type Priorities

| Emergency Type     | Base Priority |
|--------------------|:-------------:|
| Fire               | P1            |
| Medical            | P1            |
| Security Threat    | P1            |
| HazMat             | P1            |
| Natural Disaster   | P1            |
| Accident           | P2            |
| Missing Person     | P2            |
| Building Problem   | P3            |
| Other              | P3            |

#### Keyword Override (from `emergency-config.json`)

The description text is scanned for **P1 escalation keywords**:

> `unconscious`, `not breathing`, `collapsed`, `bleeding`, `seizure`, `trapped`, `weapon`, `gun`, `knife`, `attack`, `explosion`, `gas leak`, `smoke`, `fire`

And **P2 keywords**:

> `injured`, `fell`, `fracture`, `sparks`, `flooding`, `missing`, `threat`

If P1 keywords are found → priority is forced to **P1** regardless of type.  
If P2 keywords are found on a P3 base type → priority is escalated to **P2**.

#### Final Priority (3-way minimum)

```typescript
finalPriority(rulePriority, mlPriority, corroborationPriority)
// → Math.min(rule, ml ?? rule, corroboration ?? rule)
```

The final priority can only become **more urgent**, never less.

---

### 📍 2. Fuzzy Location Extraction

**File:** [`lib/emergency/locations.ts`](./lib/emergency/locations.ts)

When a reporter types a free-text description (e.g. _"fire near MB Room 204"_), the engine uses **Fuse.js fuzzy search** to extract campus location IDs with confidence scores:

- Scans n-grams (4 words down to 1 word) from the tokenized description
- Matches against the `location_aliases` table (e.g. "MB" → Main Block, ID 101)
- Uses a **0.25 confidence threshold** to avoid false positives
- Returns up to 3 locations sorted by confidence

---

### 🔐 3. Multi-Approver Gate

**File:** [`lib/emergency/approvals.ts`](./lib/emergency/approvals.ts)

Before any alert is broadcast, it must pass the `approvalsOk()` gate:

| Alert Scope        | Required Approval                                     |
|--------------------|-------------------------------------------------------|
| `responders_only`  | Any **1** approver is sufficient                      |
| `audience`         | Security Head / Admin **or** 2 distinct responders    |
| `campus_wide`      | Security Head / Admin **or** 2 distinct responders    |

This prevents a single low-level responder from broadcasting campus-wide alerts without authorization.

---

### 🤖 4. AI Type Classification Service

**File:** [`ai-service/emergency.py`](./ai-service/emergency.py)

A **FastAPI** Python service that classifies the emergency type using **semantic similarity**:

- In production: loads `intfloat/multilingual-e5-small` sentence transformer
- Computes cosine similarity between the report text and **prototype phrases** for each type
- Detects **type mismatch**: if the ML-suggested type differs from what the reporter selected by a confidence margin ≥ 0.04, a `type_mismatch: true` flag is returned for human review

**Supported emergency types:**

`fire` · `medical` · `accident` · `security_threat` · `natural_disaster` · `hazmat` · `building_problem` · `missing_person`

---

### 🗄️ 5. Database Schema (Supabase)

**File:** [`schema.sql`](./schema.sql)

The emergency module defines **10 database tables**:

| Table | Purpose |
|-------|---------|
| `incidents` | Aggregated emergency incidents (clusters of reports) |
| `emergency_reports` | Individual reports filed by campus members |
| `report_media` | Photos/videos attached to a report |
| `alerts` | Alert messages composed for broadcast |
| `alert_approvals` | Approval records per alert per approver |
| `alert_deliveries` | Per-user, per-channel delivery tracking |
| `alert_responses` | User responses (safe / need help) |
| `duty_roster` | Scheduled duty shifts for responders & security heads |
| `misuse_reviews` | Flagged false/malicious report reviews |
| `report_events` | Full audit event log |
| `report_access_log` | GDPR-compliant viewer access tracking |

Notable: `emergency_reports.text_emb` stores a **pgvector(384)** column for semantic similarity search during incident clustering.

**Incident clustering config (from `emergency-config.json`):**

```json
{
  "window_minutes": 60,
  "weights": { "text": 0.35, "type": 0.20, "location": 0.30, "time": 0.15 },
  "attach_threshold": 0.65,
  "corroboration": { "distinct_reporters": 3, "within_minutes": 10 }
}
```

---

### 🖥️ 6. Dashboard UI — Alert Composer

**File:** [`app/dashboard/page.tsx`](./app/dashboard/page.tsx)

A React-based admin interface for composing and broadcasting emergency alerts:

- **Alert Title** — Free-text title of the alert
- **Message Body** — Full message to broadcast
- **Scope selector** — `Responders Only` / `Targeted Audience` / `Campus Wide`
- **Severity selector** — `Advisory` / `Warning` / `Critical`
- Hits the `/api/alert` endpoint → checks approvals → fans out via **SMS, Web Push, and Email**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js Route Handlers (server-only) |
| Database | Supabase (PostgreSQL + pgvector + RLS) |
| AI / ML (Text) | `all-MiniLM-L6-v2` via FastAPI |
| AI / ML (Image) | `clip-ViT-B-32` via FastAPI |
| Emergency NLP | `intfloat/multilingual-e5-small` via FastAPI |
| Fuzzy Search | Fuse.js |
| Validation | Zod (via `@smart-campus/contracts`) |
| Testing | Vitest |
| Package Manager | pnpm workspaces |

---

## Architecture Diagram

```
┌──────────────────────── apps/web ─────────────────────────┐
│                                                             │
│  /lost-and-found/*    →  API /api/lost-found/*             │
│  /emergency/*         →  API /api/alert/*                   │
│                                                             │
└────────────────┬───────────────────┬───────────────────────┘
                 │                   │
                 ▼                   ▼
   ┌─────────────────────┐  ┌────────────────────────┐
   │  modules/           │  │  modules/              │
   │  lost-and-found/    │  │  emergency/            │
   │  ─────────────────  │  │  ─────────────────     │
   │  • Scoring Engine   │  │  • Priority Engine     │
   │  • State Machine    │  │  • Location Extractor  │
   │  • Privacy Layer    │  │  • Approvals Gate      │
   │  • AI Client        │  │  • Alert Composer UI   │
   │  • Validation       │  │  • FastAPI AI Service  │
   └─────────┬───────────┘  └──────────┬─────────────┘
             │                         │
             ▼                         ▼
     ┌────────────────────────────────────────┐
     │         Supabase (PostgreSQL)           │
     │  • lost_found_items, matches, claims   │
     │  • incidents, alerts, deliveries       │
     │  • pgvector embeddings                 │
     │  • Row Level Security (RLS)            │
     └────────────────────────────────────────┘
```

---

> _"Every lost item deserves to be found. Every emergency deserves to be heard."_  
> — Smart Campus, Hackathon 2026
