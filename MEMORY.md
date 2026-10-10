# MEMORY.md — Smart Campus / CampusGram Unified Operating Memory

## 1. System Overview & Core Identity
- **Project:** CampusGram (Smart Campus)
- **Repo Type:** pnpm monorepo with Next.js App Router, Supabase, shared contracts, and AI modules.
- **Primary Goal:** A single digital campus operating platform unifying student life, academic document management, AI grievance redressal, lost & found intelligence, and life-safety emergency broadcasts.
- **Design Philosophy:** Mock-first, strict contract boundaries, zero secret leakage, zero emoji in UI, high-craftsmanship dark zinc aesthetic (`bg-zinc-950`, `border-zinc-800`, `text-zinc-100`, `bg-zinc-900/60`).

---

## 2. The Four Unified Modules

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Unified CampusGram AppShell                           │
│     (Desktop Sidebar + Mobile Bottom Nav + Real-time Global Emergency Banner)   │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                          │                         │               │
         ▼                          ▼                         ▼               ▼
┌──────────────────┐       ┌──────────────────┐      ┌────────────────┐ ┌───────────────┐
│     MODULE 1     │       │     MODULE 2     │      │    MODULE 3    │ │   MODULE 4    │
│  Campus Portal   │       │    Complaint     │      │  Lost & Found  │ │   Emergency   │
│  & Social Feed   │       │   Intelligence   │      │  Intelligence  │ │ Alert System  │
├──────────────────┤       ├──────────────────┤      ├────────────────┤ ├───────────────┤
│ • /home          │       │ • /complaints    │      │ • /lost-and-   │ │ • /emergency  │
│ • /documents     │       │ • Gemini AI eval │      │   found        │ │ • 1-tap SOS   │
│ • /faculty       │       │ • Duplicate      │      │ • Multimodal   │ │ • Broadcast   │
│ • /login         │       │   clustering     │      │   matching     │ │   console     │
│ • Onboarding     │       │ • Auto-routing   │      │ • Zero-knowl.  │ │ • Safety      │
│ • Identity auth  │       │ • Thresholding   │      │   handover     │ │   check-in    │
└──────────────────┘       └──────────────────┘      └────────────────┘ └───────────────┘
```

### Module 1: Campus Portal & Social Feed
- **Routes:** `/home`, `/documents`, `/faculty`, `/faculty/documents`, `/faculty/submissions`, `/login`, `/onboarding`, `/settings`, `/profile`
- **Ownership:** `apps/web`
- **Features:** Campus feed, verified role badges, student document management, faculty academic announcements, institutional identity lookup via simulated OTP.

### Module 2: Complaint Intelligence
- **Routes:** `/complaints`, `/api/complaints`, `/api/complaints/upload`
- **Ownership:** `modules/complaint-intelligence` & `apps/web/app/complaints`
- **Features:** AI categorization, severity scoring (1-5), duplicate grievance clustering (lexical + semantic similarity >= 0.35), automatic emergency escalation threshold (>= 5 corroborating reports), and department dispatch.

### Module 3: Lost & Found Intelligence
- **Routes:** `/lost-and-found`, `/lost-and-found/browse`, `/lost-and-found/report/lost`, `/lost-and-found/report/found`, `/lost-and-found/items/[id]`, `/lost-and-found/matches/[id]`, `/lost-and-found/claims/[id]`, `/lost-and-found/my-reports`, `/lost-and-found/admin`
- **Ownership:** `modules/lost-and-found`, `services/lost-found-ai`, `workers/lost-found-worker`
- **Features:** Multimodal matching engine (CLIP visual + MiniLM text embeddings), privacy filtering (concealing distinguishing marks from public view), fraud-resistant verification questions, physical custody handovers at Central Security Desk.

### Module 4: Emergency Alert System
- **Routes:** `/emergency`, `/api/emergency/alerts`, `/api/emergency/reports`, `/api/emergency/check-in`
- **Ownership:** `packages/contracts/src/emergency.ts`, `apps/web/lib/emergency`, `apps/web/app/emergency`
- **Features:**
  - One-tap SOS rapid triage (`fire`, `medical`, `security_threat`, `hazmat`, `building_problem`, `other`) with automatic rule priority scoring (P1-P4).
  - Campus Broadcast Dispatch Console for authorized staff to broadcast `critical`, `warning`, or `advisory` alerts.
  - Multi-channel fan-out delivery simulation: In-App, Push Notifications, SMS blast, Campus PA siren.
  - Real-time global `EmergencyBanner` in `AppShell` with immediate action checklists and assembly points.
  - Interactive Safety Check-In (`I am Safe` vs `Need Assistance`).
  - 24/7 direct dial emergency hotlines directory.

---

## 3. Design System & UI Consistency
- **Framework:** Next.js App Router + Tailwind CSS + shadcn/ui primitives.
- **Theme Palette:** Zinc-950 (`#09090b`), Zinc-900 cards (`#18181b`), Zinc-800 borders (`#27272a`), Zinc-100 titles (`#f4f4f5`), Zinc-400 muted text (`#a1a1aa`).
- **Icons:** Strict `lucide-react` iconography (no raw emojis anywhere in UI code).
- **Navigation:**
  - Desktop: Collapsible/sticky Sidebar with organized module sections ("Campus Life", "Campus Systems", "Faculty & Academic", "Account").
  - Mobile: Sticky `MobileHeader` with institutional avatar + backdrop-blurred `MobileBottomNav` with quick 1-tap switching across all 4 modules.
  - App Shell: Every portal view is safely guarded with `ProtectedRoute` and auto-notified via `EmergencyBanner`.

---

## 4. Shared Contracts (`packages/contracts`)
The single source of truth for runtime Zod validation and TypeScript types:
- `complaint.ts`: Grievance records, AI analysis, category enums, cluster matches.
- `campus-posts.ts`: Social posts, feed filtering, interactions.
- `documents.ts`: Student academic document types and storage.
- `faculty-academic-documents.ts`: Faculty notices, scopes, student submissions.
- `lost-and-found.ts`: Item records, match scores, claims, state machine.
- `emergency.ts`: Emergency report, broadcast alert, safety check-in schemas.
- `identity.ts`: Institutional biodata, roles, multi-responsibility tags.

---

## 5. Development & Testing Commands
```bash
# Start local development server (runs on port 3000/3001)
pnpm dev

# Full monorepo typecheck (all 9 workspace projects)
pnpm typecheck

# Full monorepo unit test suite
pnpm test

# Format codebase
pnpm format
```

---

## 6. Current Lost & Found Implementation Memory — 2026-10-09

The authoritative continuation record for the recent Lost & Found work is:

```text
docs/progress/LOST_FOUND_HANDOFF.md
docs/progress/MODULE_3_STATUS.md
```

### Current status

- Working branch: `feature/lost-found-workflow`.
- Baseline before the workflow pass: `6eb34bf`.
- Classification: **Integrated Hackathon System**, not production-ready.
- Web app: `http://localhost:3000`.
- Mock FastAPI AI service: `http://127.0.0.1:8000` with `USE_MOCK_MODELS=true`.
- Hosted Supabase is configured as the current web persistence authority.
- Local Supabase is optional for the current hosted flow; Docker was installed but
  the long-running OmniRush shell may need to be restarted to receive the `docker`
  group before `supabase start` can access `/var/run/docker.sock`.

### Actual Module 3 workflow

```text
Institutional ID → mock OTP → signed HTTP-only session → server identity
→ server capabilities → privacy-safe Lost & Found projections
→ hosted Supabase persistence → inline Next.js processing queue
→ AI service / deterministic fallback → weighted match candidate
→ verification claim → authorized finder decision → claimant handover
→ both linked item reports resolved
```

The inline queue in `apps/web/lib/queue.ts` is the normal hosted-Supabase web
processing path. The standalone pg-boss worker is a separate deployment option,
not a required local process for the current web flow.

### AI matching memory

- AI endpoint: `POST services/lost-found-ai/app/main.py:/analyze`.
- Mock outputs are deterministic and explicitly marked with `isMock: true`.
- Text embedding: 384 dimensions.
- Image embedding: optional 512 dimensions.
- Matching weights: image `0.20`, text `0.45`, category `0.15`, location `0.10`,
  time `0.10`.
- Bands: high `>= 0.75`, medium `>= 0.50`, low `< 0.50`.
- Similarity is an empirical candidate signal, never ownership proof.

### Workflow/security memory

- UI pages no longer use hardcoded production user IDs or localStorage identity.
- Item, match, and claim responses expose minimal server-derived capability flags,
  not raw ownership IDs.
- Approval requires valid, non-empty, normalized verification answers.
- Repeated/stale/unauthorized actions return `400`, `403`, or `409` rather than fake
  success.
- Handover is claimant-only after approval and resolves both linked item reports.
- Contact details are never fabricated; the demo directs parties to Campus Security
  when no institutional contact source is available.
- Public projections continue to omit private descriptions, identifying marks,
  reporter/claimant/decision-maker IDs, storage paths, raw joins, and contacts.

### Runtime and verification memory

The Python environment is `services/lost-found-ai/.venv`; `requests` and `pillow`
were added to the service requirements because the existing code imports them.
The TypeScript AI client preserves the Python service's mock/live provenance flag.

Latest verification included full monorepo tests (**276 passing**), Lost & Found
module tests (**31 passing**), AI service tests (**2 passing**), worker typecheck,
Lost & Found typecheck, prior web build/typecheck/lint, and `git diff --check`.
Mock lookup → OTP send → OTP verify → session → My Reports API also passed.

Do not store or document credentials from `.env.local`; only record that the
environment is configured. Keep all secrets private and uncommitted.
