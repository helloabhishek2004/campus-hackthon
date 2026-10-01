# AGENTS.md — Agent & AI Pair Programming Operating Manual

This repository is designed for collaborative development by multiple developers and AI coding agents (Antigravity, Claude Code, Codex, Gemini CLI). All coding agents MUST adhere strictly to the rules and boundaries outlined in this document.

---

## 1. Prime Directive: Read Before You Act

Before inspecting, writing, or modifying any code in this repository, you MUST read the following documents in exact order:

1. **`AGENTS.md`** (this file)
2. **`PROJECT_CONTEXT.md`** (the purpose, constraints, and scope of Smart Campus)
3. **`ARCHITECTURE.md`** (monorepo layers, boundaries, data flow)
4. **`INTEGRATION_CONTRACT.md`** (the shared contracts between modules)
5. **The relevant module README** (`modules/complaint-intelligence/README.md` or `docs/modules/MODULE_1.md`)

**Rule:** Make the smallest change required. Never blindly scaffold over existing working code.

---

## 2. Hard Architectural Boundaries & Ownership

This repository is a **pnpm monorepo** with explicit domain ownership:

```text
smart-campus/
├── apps/web/                          # Owned by Module 1 & UI developers
│   └── Next.js App Router, student portal, dashboards, server routes
│
├── modules/complaint-intelligence/    # Owned by Module 2 (AI developer)
│   └── AI classification, severity scoring, duplicate clustering, routing
│
├── modules/lost-and-found/            # Owned by Module 3 (Lost & Found developer)
│   └── Matching engine, state machine, privacy rules, storage abstractions
│
├── services/lost-found-ai/            # Owned by Module 3 (Stateless FastAPI AI service)
├── workers/lost-found-worker/         # Owned by Module 3 (Async background worker)
│
├── packages/contracts/                # SHARED CONTRACTS — Single Source of Truth
│   └── TypeScript types & Zod validation schemas
│
├── packages/ui/                       # SHARED UI Components (shadcn/tailwind)
├── packages/utils/                    # SHARED utilities (cn, error helpers)
├── packages/config/                   # SHARED config (TypeScript, ESLint)
└── supabase/                          # SHARED persistence & migrations
```

### Strict Non-Interference Rules

- **Module 3 Developer/Agent (Lost & Found):**
  - Owns `modules/lost-and-found/`, `services/lost-found-ai/`, `workers/lost-found-worker/`, and Lost & Found documentation.
  - May modify `apps/web/app/lost-and-found/` and `apps/web/app/api/lost-found/`.
  - MUST NOT casually modify Module 1 implementation (`apps/web/app/(portal)`), Module 2 implementation (`modules/complaint-intelligence/`), root configurations, or existing database migrations.
  - Uses existing `public.profiles` / `auth.users` — MUST NOT create duplicate user identity systems.

- **Module 2 Developer/Agent:**
  - Works inside `modules/complaint-intelligence/`.
  - Exposes ONLY `analyzeComplaint(request)` (and candidate search helpers).
  - MUST NOT import from `apps/web/` or depend on React/DOM.
  - MUST NOT create duplicate database tables for users, roles, or canonical complaints.

- **Module 1 Developer/Agent:**
  - Works inside `apps/web/`.
  - Interacts with Module 2 and Module 3 EXCLUSIVELY via `@smart-campus/contracts` and public module exports.
  - MUST NOT alter prompts, similarity algorithms, or internal files inside `modules/complaint-intelligence/` or `modules/lost-and-found/`.

- **Shared Contracts:**
  - Modifying `packages/contracts` requires mutual alignment. Never make breaking changes silently. Always favor additive updates (e.g., optional fields) over renames.

---

## 3. Security & Environment Variable Rules

- **Zero Secret Leakage:**
  - `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` MUST NEVER be exposed to browser code.
  - Gemini calls MUST occur server-side (Next.js Route Handlers, Server Actions, or backend scripts).
  - Only variables prefixed with `NEXT_PUBLIC_` may be consumed in client components.
  - NEVER commit `.env`, `.env.local`, or credentials to git.

---

## 4. Deterministic Mock Mode

- Module 2 provides a **Mock Mode** (`AI_PROVIDER=mock`).
- Institutional Authentication provides an **OTP Mock Mode** (`OTP_PROVIDER=mock`, test code `123456`).
- Developers working on Module 1 (UI, feed, auth) can run and test the complete end-to-end complaint and login pipelines without needing external API keys or SMS gateways.
- Mock modes implement the EXACT same contracts and Zod validation as live modes.

---

## 5. Institutional Identity & Privacy Rules

- **Pre-existing Biodata:** Users do NOT self-register raw profiles. The institution maintains canonical records in `institutional_users`, `student_biodata`, and `faculty_biodata`.
- **Phone Masking & RLS:** Raw phone numbers MUST NEVER be exposed to unauthenticated clients. Identity lookups return masked phone numbers (e.g. `+91 ******0001` or `******0001`).
- **Simulated OTP Verification:** Login verifies institutional ID against registered phone via simulated/mock OTP challenges before creating or linking application sessions (`public.profiles`).
- **Multi-Responsibility Tags:** Users can hold multiple institutional tags simultaneously (`CAS_COORDINATOR`, `DEPARTMENT_COORDINATOR`, `COURSE_COORDINATOR`, `CLASS_COORDINATOR`, `HOD`).

---

## 6. Coding & Validation Standards

- **Runtime Validation:** Never trust raw AI outputs or untrusted network inputs. Always validate using Zod schemas from `@smart-campus/contracts`.
- **No Premature Complexity:**
  - DO NOT add Kubernetes, Docker compose, Redis, Kafka, RabbitMQ, microservices, GraphQL, or standalone Express servers.
  - Keep the stack: Next.js + Supabase + Gemini + Shared Contracts + pnpm workspaces.
- **Testing:**
  - Every module must maintain unit tests in its own `tests/` directory.
  - Run `pnpm test` and `pnpm typecheck` before concluding work.

---

## 6. Git & Commit Guidelines

- Work on feature branches: `feature/module-1`, `feature/module-2`, `feature/shared-contracts`.
- Use conventional commits:
  - `feat(module-2): add duplicate issue clustering`
  - `fix(contracts): add optional department filter`
  - `docs: update integration contract specifications`
