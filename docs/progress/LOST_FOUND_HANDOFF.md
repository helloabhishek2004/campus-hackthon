# Lost & Found — Conversation Handoff and Current Operating Context

> Updated after the Lost & Found workflow integration and local runtime setup conversation.
> This document contains no credentials, tokens, or private environment values.

## Current repository state

- Repository: CampusGram / Smart Campus pnpm monorepo.
- Working branch: `feature/lost-found-workflow`.
- Baseline commit before this implementation pass: `6eb34bf` (`feat: finalize lost and found supabase integration`).
- Changes are local and uncommitted. Do not reset or discard the existing work.
- Module ownership boundaries remain unchanged: Module 3 owns Lost & Found domain, AI service, worker, UI, and API routes; shared contracts remain the source of truth.

## User-visible outcome

The Lost & Found module moved from **functional prototype / judge-demo ready** to
**Integrated Hackathon System**:

```text
Institutional ID
  ↓
Dummy OTP (123456 in mock mode)
  ↓
HTTP-only signed application session
  ↓
Server identity resolution
  ↓
Server-derived authorization/capabilities
  ↓
Privacy-safe Lost & Found API projections
  ↓
Supabase persistence + processing
  ↓
Capability-gated UI workflow
```

The complete student workflow is now connected in code:

```text
Report lost/found item
  ↓
processing status
  ↓
AI/matching processing
  ↓
candidate match
  ↓
eligible owner starts claim
  ↓
claimant submits verification answers
  ↓
authorized finder reviews answers
  ↓
finder approves/rejects
  ↓
approved claimant confirms handover
  ↓
both linked item reports become resolved
```

## Architecture decisions preserved

- No real Supabase Phone Auth, SMS, Redis, Kafka, RabbitMQ, Kubernetes, or new identity system was added.
- Mock OTP remains the institutional authentication mode for demo/local work.
- Hosted Supabase remains authoritative when the web environment is configured for it.
- JSON/local persistence remains only for tests or explicit mock-only fallback.
- Public responses do not expose `reporter_id`, `claimant_id`, `decided_by`, private descriptions, identifying marks, storage paths, raw joined database rows, or private contact data.
- UI permissions are never based on hidden buttons, local storage, request-body IDs, or hardcoded production IDs. Server-provided boolean capabilities control presentation; APIs re-authorize every mutation.
- Image uploads remain bounded base64 demo storage because no approved production Storage upload path was introduced in this pass.
- Notifications remain simulated/console-oriented. No notification is presented as delivered.

## Lost & Found AI and matching

The module has an AI-assisted matching pipeline, not an automatic ownership decision.

### Python AI service

Location:

```text
services/lost-found-ai/
```

Endpoints:

```text
GET  /health
POST /analyze
```

The service can host YOLO, CLIP, and MiniLM inference, but the current local runtime
uses deterministic mock models:

```text
USE_MOCK_MODELS=true
```

The service returns a 384-dimensional text embedding, an optional 512-dimensional
image embedding, detected objects, category suggestion, and an explicit `isMock`
flag. The TypeScript AI client preserves that provenance flag and falls back to
deterministic vectors if the service is unreachable.

### Actual scoring configuration

Source: `modules/lost-and-found/src/scoring/matching-config.json`

```text
image:    0.20
text:     0.45
category: 0.15
location: 0.10
time:     0.10
```

Bands:

```text
high:   >= 0.75
medium: >= 0.50
low:    < 0.50
```

These are empirical similarity heuristics, not probabilities or ownership proof.

### Processing topology currently used by the web app

The web app has an inline processing queue in `apps/web/lib/queue.ts`. With hosted
Supabase configuration, this path calls the AI service and writes embeddings,
matches, and events through the server-side service client. The separate
`workers/lost-found-worker` remains an independent pg-boss deployment option; it
is not required for the current hosted-Supabase web flow.

## Security and workflow implementation

Server-derived item capabilities include the relationship needed by the UI without
reintroducing ownership identifiers. Claim capabilities include claimant/finder
relationship, answer permission, decision permission, approval eligibility,
handover eligibility, and contact-instruction eligibility.

Verification answers are validated using the existing `ClaimSchema` contract and
normalized before persistence. Approval requires valid non-empty evidence and a
reviewable claim. Invalid or stale workflow actions return semantic `400`, `403`,
or `409` responses rather than fake success.

Handover is claimant-only after approval. It records the handover mode, transitions
both linked item reports to `resolved`, and writes audit events. Direct contact
details are not fabricated; the UI directs parties to Campus Security when the demo
does not have an institutional contact source.

The personal reports endpoint supports:

```text
GET /api/lost-found/items?mine=true&status=all&page=1&limit=20
```

Ownership is derived from the authenticated server identity. The client never sends
a user ID to define the scope.

## Files and documentation

The detailed changed-file inventory, regression scope, scorecard, browser status,
and remaining work are maintained in:

```text
docs/progress/MODULE_3_STATUS.md
```

The main workflow implementation touches the Lost & Found API routes, repository,
client workflow helpers, report/match/claim/item pages, demo-image validation,
Module 3 validation, and focused tests. The complete inventory is intentionally
kept in the status document rather than duplicated here.

## Runtime setup completed in this conversation

### Web app

```text
http://localhost:3000
```

The Next.js dev server was started and `/login` returned HTTP 200.

### Python environment

```text
services/lost-found-ai/.venv
```

Installed from `services/lost-found-ai/requirements.txt`:

- FastAPI
- Uvicorn
- Pydantic
- Pytest
- HTTPX
- Requests
- Pillow

The requirements file was corrected because the service imports Requests and PIL
even when full ML libraries are not installed.

### Current local AI process

The mock AI service is running at `127.0.0.1:8000`. Verified:

- `/health` returns healthy with `mock_mode: true`.
- `/analyze` returns a 384-dimensional text embedding and `isMock: true`.
- Python AI tests pass.

### Docker and local Supabase

Docker was installed after the initial setup attempt. The current OmniRush shell
may still need to be restarted after the user was added to the `docker` group; the
existing process did not yet have the supplementary group. Once the refreshed shell
can access `/var/run/docker.sock`, run:

```bash
supabase start
```

The Supabase CLI is installed (`3.0.0-next.4`) and the repo already has
`supabase/config.toml`. Local Supabase is optional for the current hosted-Supabase
web flow, but is required to run the standalone pg-boss worker against the default
local database port `54322`.

## Verification receipts

Latest checks from this conversation:

```text
pnpm test --no-cache                         PASS — 276 tests
pnpm --filter @smart-campus/lost-and-found test PASS — 31 tests
pnpm --filter @smart-campus/lost-and-found typecheck PASS
pnpm --filter @smart-campus/lost-found-worker typecheck PASS
pnpm typecheck --incremental false           PASS in the prior integration pass
pnpm lint                                    PASS with existing warnings
pnpm --filter @smart-campus/web build        PASS in the prior integration pass
git diff --check                             PASS
Python AI tests                              PASS — 2 tests
```

Mock authentication smoke test passed for the seeded student demo identity:

```text
lookup → OTP send → OTP verify → HTTP-only session → /api/auth/session → My Reports
```

The built-in browser rendered the login page, but a full interactive multi-user
browser walkthrough was not completed because browser tab actions required user
review/sign-in handoff. Do not claim browser E2E completion from the API tests.

## Remaining work

### P1

- Complete the two-party browser walkthrough against the intended hosted or local
  Supabase environment: report → match → claim → answers → finder decision → handover.
- Verify rejection and unrelated-user access in the browser.

### P2

- Complete viewport/accessibility acceptance checks at the requested sizes.
- Improve detailed queue progress and finder-specific question prompting.
- Add broader lifecycle/dismissal controls if the demo requires them.

### P3

- Make linked claim/item writes transactional and enforce concurrent uniqueness at
  the database layer.
- Add durable worker recovery, real Storage uploads, real notification delivery,
  rate limiting, and production operations.
- Run live RLS acceptance tests for a future real-Supabase-auth path.

## Do not do next

- Do not rewrite the Lost & Found architecture.
- Do not replace the inline hosted-Supabase processing path with a local-only path.
- Do not expose private identifiers to repair a UI problem.
- Do not add real SMS, push, Redis, Kafka, or a second authentication system.
- Do not commit `.env`, `.env.local`, service-role credentials, cookies, or tokens.
