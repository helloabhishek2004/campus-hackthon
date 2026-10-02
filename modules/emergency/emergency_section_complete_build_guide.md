# Smart Campus Emergency Section: Complete Build Guide

**Stack:** Next.js (App Router) · PostgreSQL (+ pgvector) · pg-boss worker · FastAPI AI service · SSE for live updates
**Scope:** the Emergency section of the Smart Campus website. It reuses the users, locations, auth, worker and AI service from the Lost & Found guide (`lost_and_found_complete_build_guide.md`).

> **Safety note.** This system is an aid, not a replacement for calling emergency services. Every screen must keep direct call options visible (India's unified emergency number is **112**; also keep the campus security desk number prominent. Confirm the numbers your campus uses). Run drills (section 11.6) before going live.

---

## 0. Decisions and principles

### 0.1 Decisions at a glance

| Question | Decision |
|---|---|
| Who can report? | Any logged-in campus member. Campus ID is attached **automatically from the session**. |
| Anonymous? | No. Identity is visible to responders and admins only, never to other students, never in alerts. |
| Who decides a campus alert? | **Humans only** (security / admin). ML never sends or blocks an alert. |
| Role of ML | Assist: classify, extract location, group duplicates, flag spam, prioritize, summarize, image hints. |
| False reports | Recorded with the reporter's ID **only after human review**. Good-faith mistakes are never penalized. |
| Real-time updates | SSE (Postgres `LISTEN/NOTIFY`), with polling fallback. |
| Infra | Reuse: Postgres, pg-boss worker, FastAPI AI service, notification service, `users`, `locations`. |

### 0.2 Non-negotiable principles

1. **Report first, enrich later.** Submitting needs only *type + location* (two taps). Description, photos and details are optional and can be added after submitting.
2. **Dispatch never waits for verification.** Verification gates **public alerts**, not sending help. Responders are paged the moment a report arrives.
3. **Rules before ML.** A deterministic rule engine sets a priority floor that works with the AI service completely down.
4. **ML can only raise attention.** It may raise priority, add context and group reports. It can **never** lower a priority, delay a report, reject a report or send an alert.
5. **Reporter history is context, not a filter.** A prior false report is shown to the human reviewer. It never delays, suppresses or auto-rejects a new report.
6. **Good faith is protected.** "Report if in doubt" is stated in the UI. Only confirmed malicious misuse, after security and admin review, is recorded against a person. The system never punishes automatically.
7. **Fail safe.** If anything breaks (AI, worker, SMS), the report still reaches a human, and the reporter is told to call.
8. **Privacy.** No reporter identity or victim details in alerts. Every access to reporter identity is logged.

### 0.3 Where this guide differs from the pasted flow

- The pasted flow was `report → verify → alert or reject`. Here, **dispatch happens immediately**, verification gates only the **public alert**, and alerts have scopes (responders only / audience groups / campus-wide).
- "AI/rule-based verification" becomes **triage assist** for a human, not a verification step that can reject.
- Rejection has distinct outcomes (`duplicate`, `not_emergency`, `false_good_faith`, `false_malicious`) so honest mistakes are not treated like pranks.

---

## 1. Goals and non-goals

**Goals**
- Fast, low-friction emergency reporting from a phone.
- Immediate notification of on-duty responders with escalation if nobody responds.
- Automatic grouping of reports about the same incident, with corroboration made visible.
- Human-controlled alerts with templates, approvals, delivery tracking and an all-clear.
- Complete audit trail: who reported, who acknowledged, who decided, who saw what.
- Fair, documented handling of false reports.

**Non-goals**
- ML deciding whether something is "real" or sending alerts automatically.
- Automatic penalties of any kind.
- Replacing the campus security control room or the national emergency number.
- Continuous location tracking of students.

---

## 2. Architecture

```
 Student phone (Next.js UI / PWA)                Security console (Next.js)
        |  POST report (idempotent)                     ^   SSE stream (+ polling fallback)
        v                                               |
 Next.js route handlers ----> PostgreSQL ---- LISTEN/NOTIFY
   auth | validation | rule priority | state machine     |
        |                       ^                         |
        | enqueue (after commit)|                         |
        v                       |                         |
   pg-boss queue ----> Worker (Node) ----> AI service (FastAPI)
                         notify-responders   multilingual embeddings
                         enrich-report       type suggestion, image hints
                         cluster / escalate  (LLM optional: summary, translation)
                         deliver-alert  ---> SMS gateway / web push / email
                         sweeper, SLA timers
```

**Two paths, deliberately separate**

| Path | Contains | Depends on AI? |
|---|---|---|
| **Critical path** (must be instant) | Save report → rule priority → notify responders → show on console | **No** |
| **Enrichment path** (best effort) | Embeddings, type check, location extraction, clustering, image hints, summary | Yes, and failure is tolerated |

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js App Router, TypeScript, Tailwind, `next-intl` | Large tap targets, icon-first UI, multilingual labels |
| Validation | zod | Shared client/server |
| ORM / DB | Prisma + PostgreSQL 16 + pgvector | `$queryRaw` for vector queries |
| Queue | pg-boss | Job `priority` option so P1 jobs run first |
| Live updates | SSE route handler + Postgres `LISTEN/NOTIFY` | Self-hosted Node runtime (long-lived connections) |
| AI service | FastAPI (shared with Lost & Found) | Adds `/emergency/*` endpoints |
| Embeddings | `intfloat/multilingual-e5-small` (384-d) | Handles regional languages. **Verify coverage on your own test set.** |
| Image hints | CLIP `clip-ViT-B-32` (already used) | Zero-shot labels, hints only |
| Fuzzy location match | Fuse.js | Against location names and aliases |
| Maps | Leaflet + OpenStreetMap tiles (or floor-plan images) | Console incident map |
| SMS / push / email | Campus notification service + SMS gateway, `web-push` | See 11.4 |
| E2E tests | Playwright | |

---

## 4. Identity, roles and tracking

### 4.1 Login

Same as Lost & Found: campus ID + phone + OTP, session cookie. Phone is stored in E.164 and verified (`phone_verified_at`). Responders need a **verified phone** so they can be paged and can call reporters back.

### 4.2 Roles and permissions

| Capability | student / staff | responder | security_head | admin |
|---|:--:|:--:|:--:|:--:|
| Submit reports, see **own** reports | Yes | Yes | Yes | Yes |
| See console and all reports | | Yes | Yes | Yes |
| See reporter identity + phone (logged) | | Yes | Yes | Yes |
| Acknowledge, triage, verify, reject | | Yes | Yes | Yes |
| Draft alerts | | Yes | Yes | Yes |
| Approve **responders-only** alert | | Yes | Yes | Yes |
| Approve **audience / campus-wide** alert | | Two distinct responders | **Alone** | **Alone** |
| Manage roster, config, templates | | | | Yes |
| Review misuse cases, view audit log | | | | Yes |

### 4.3 What is tracked automatically

- `reporter_id` comes from the session, **never from a form field**.
- `report_events`: every state change with actor and timestamp.
- `report_access_log`: every time staff open reporter identity or phone.
- Alert drafting, approvals and send events with approver IDs.
- Per-recipient alert delivery status.
- Misuse reviews with decisions, reviewers and appeal outcome.

---

## 5. Lifecycles and timers

### 5.1 Report states

```
submitted --> acknowledged --> verifying --> verified --> resolved
     \             \              \
      +-------------+--------------+--> rejected (reason: duplicate | not_emergency |
                                                  false_good_faith | false_malicious | test)
```

### 5.2 Incident states

```
open --> confirmed --> responding --> contained --> resolved --> closed (post-incident notes)
  \--> dismissed (all linked reports rejected)
```

A **report** is one person's submission. An **incident** is the real-world event; many reports can attach to one incident.

### 5.3 Alert states

```
draft --> pending_approval --> approved --> sending --> sent
                    \--> cancelled
```

Alerts are versioned. Later messages on the same incident are `update` or `all_clear` kinds.

### 5.4 Acknowledgement timers (configurable)

| Priority | Meaning | Must be acknowledged within | Escalation if not |
|---|---|---|---|
| **P1** | Critical, life safety | 2 min | Page `security_head` at 2 min; page admin at 4 min; console alarm stays on |
| **P2** | Urgent | 5 min | Page `security_head` at 5 min, admin at 10 min |
| **P3** | Standard | 30 min | Flag on console |
| **P4** | Information | 2 h | Flag on console |

---

## 6. Data model

`users` already exists. `locations` comes from the Lost & Found guide and is **extended** here (rooms repeat across buildings, so drop the old `UNIQUE(name)` and use `UNIQUE(parent_id, name)`).

```sql
-- Extend locations (or create it with these columns if Lost & Found isn't built yet)
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_name_key;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS parent_id       INT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS kind            TEXT NOT NULL DEFAULT 'building'
      CHECK (kind IN ('campus','building','floor','room','outdoor')),
  ADD COLUMN IF NOT EXISTS building_id     INT REFERENCES locations(id),  -- the building this belongs to
  ADD COLUMN IF NOT EXISTS assembly_point  TEXT,                          -- used in evacuation templates
  ADD COLUMN IF NOT EXISTS qr_slug         TEXT UNIQUE;                   -- for QR codes at rooms/entrances
CREATE UNIQUE INDEX IF NOT EXISTS locations_parent_name ON locations (COALESCE(parent_id,0), name);

CREATE TABLE location_aliases (
  location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,            -- "main block", "MB", "cse block", regional names
  PRIMARY KEY (location_id, alias)
);

CREATE TABLE incidents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref          TEXT UNIQUE NOT NULL,                 -- INC-2026-000045
  type                TEXT NOT NULL,
  location_id         INT  NOT NULL REFERENCES locations(id),
  priority            SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 4),
  status              TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','confirmed','responding','contained',
                                        'resolved','closed','dismissed')),
  summary             TEXT,
  summary_source      TEXT CHECK (summary_source IN ('ai','manual','template')),
  report_count        INT NOT NULL DEFAULT 1,
  distinct_reporters  INT NOT NULL DEFAULT 1,               -- corroboration counts people, not reports
  first_report_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_report_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_by        INT REFERENCES users(id),
  confirmed_at        TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  post_incident_notes TEXT,
  is_drill            BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE emergency_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref            TEXT UNIQUE NOT NULL,               -- ER-2026-000123
  reporter_id           INT  NOT NULL REFERENCES users(id),
  client_request_id     UUID NOT NULL,                      -- idempotency key from the client
  type                  TEXT NOT NULL CHECK (type IN
      ('fire','medical','accident','security_threat','natural_disaster',
       'hazmat','building_problem','missing_person','other')),
  location_id           INT  NOT NULL REFERENCES locations(id),
  location_note         TEXT,                               -- "near the stairs"
  geo_lat               DOUBLE PRECISION,
  geo_lng               DOUBLE PRECISION,
  geo_accuracy_m        REAL,
  description           TEXT,                               -- optional, can be added later
  is_drill              BOOLEAN NOT NULL DEFAULT false,

  rule_priority         SMALLINT NOT NULL,
  ml_priority           SMALLINT,
  priority              SMALLINT NOT NULL,                  -- final = MIN(rule, ml, corroboration)

  status                TEXT NOT NULL DEFAULT 'submitted'
      CHECK (status IN ('submitted','acknowledged','verifying','verified','resolved','rejected')),
  rejection_reason      TEXT CHECK (rejection_reason IN
      ('duplicate','not_emergency','false_good_faith','false_malicious','test')),
  incident_id           UUID REFERENCES incidents(id),

  text_emb              vector(384),
  ml                    JSONB NOT NULL DEFAULT '{}',        -- type suggestions, language, extracted locations, spam signals
  enrichment_status     TEXT NOT NULL DEFAULT 'pending'
      CHECK (enrichment_status IN ('pending','done','failed','skipped')),
  flags                 JSONB NOT NULL DEFAULT '{}',        -- e.g. {"rate_exceeded":true}

  responders_notified_at TIMESTAMPTZ,                       -- sweeper retries if NULL
  acknowledged_by       INT REFERENCES users(id),
  acknowledged_at       TIMESTAMPTZ,
  verified_by           INT REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, client_request_id)
);
CREATE INDEX er_status_prio ON emergency_reports (status, priority, created_at);
CREATE INDEX er_incident    ON emergency_reports (incident_id);
CREATE INDEX er_reporter    ON emergency_reports (reporter_id, created_at DESC);

CREATE TABLE report_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('image','video')),
  path        TEXT NOT NULL,
  bytes       INT,
  captured_at TIMESTAMPTZ,
  hints       JSONB                                          -- image hint labels (display only)
);

CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id      UUID NOT NULL REFERENCES incidents(id),
  version          INT  NOT NULL DEFAULT 1,
  kind             TEXT NOT NULL CHECK (kind IN ('alert','update','all_clear')),
  severity         TEXT NOT NULL CHECK (severity IN ('advisory','warning','critical')),
  scope            TEXT NOT NULL CHECK (scope IN ('responders_only','audience','campus_wide')),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  translations     JSONB,                                    -- {"ml": {"title":..., "body":...}}
  audience         JSONB NOT NULL,                           -- {"all":true} | {"roles":[],"departments":[],"hostels":[]}
  channels         TEXT[] NOT NULL,                          -- {banner,push,sms,email}
  is_drill         BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','pending_approval','approved','sending','sent','cancelled')),
  drafted_by       INT NOT NULL REFERENCES users(id),
  drafted_with_ai  BOOLEAN NOT NULL DEFAULT false,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alert_approvals (
  alert_id    UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  approver_id INT  NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, approver_id)
);

CREATE TABLE alert_deliveries (
  id           BIGSERIAL PRIMARY KEY,
  alert_id     UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id      INT  NOT NULL REFERENCES users(id),
  channel      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','sent','delivered','failed','skipped')),
  provider_ref TEXT,
  error        TEXT,
  sent_at      TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  UNIQUE (alert_id, user_id, channel)
);

CREATE TABLE alert_responses (                               -- optional "I'm safe / need help"
  alert_id   UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id    INT  NOT NULL REFERENCES users(id),
  response   TEXT NOT NULL CHECK (response IN ('safe','need_help')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, user_id)
);

CREATE TABLE duty_roster (
  id        SERIAL PRIMARY KEY,
  user_id   INT NOT NULL REFERENCES users(id),
  role      TEXT NOT NULL CHECK (role IN ('responder','security_head')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX duty_now ON duty_roster (starts_at, ends_at);

CREATE TABLE misuse_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID NOT NULL UNIQUE REFERENCES emergency_reports(id),
  user_id        INT  NOT NULL REFERENCES users(id),
  flagged_by     INT  NOT NULL REFERENCES users(id),
  flag_note      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','dismissed')),
  reviewed_by    INT REFERENCES users(id),
  reviewed_at    TIMESTAMPTZ,
  reviewer_note  TEXT,
  user_notified_at TIMESTAMPTZ,
  appeal_note    TEXT,
  appeal_outcome TEXT CHECK (appeal_outcome IN ('upheld','overturned')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_events (                                  -- timeline + audit, append-only
  id          BIGSERIAL PRIMARY KEY,
  report_id   UUID REFERENCES emergency_reports(id),
  incident_id UUID REFERENCES incidents(id),
  actor_id    INT REFERENCES users(id),                       -- NULL = system
  event       TEXT NOT NULL,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_access_log (                              -- who looked at reporter identity
  id         BIGSERIAL PRIMARY KEY,
  report_id  UUID NOT NULL REFERENCES emergency_reports(id),
  viewer_id  INT  NOT NULL REFERENCES users(id),
  what       TEXT NOT NULL,                                   -- 'identity' | 'phone' | 'media'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. Student experience

### 7.1 Report flow (target: under 10 seconds, two decisions)

```
[Emergency hub]  ->  big red "Report Emergency"   +  always-visible  "Call 112 / Security"
        |
        v
 Step 1  Pick type (large icon tiles; labels in the user's language)
 Step 2  Confirm location (prefilled) or pick Building > Floor > Room
 [ SEND ]                                        <- description/photo NOT required
        |
        v
 Confirmation: reference ER-..., status stepper, safety tips for that type,
               "Add details" (text, photo, video), "Call now", callback notice
```

**Location, best sources first**
1. **QR code** at rooms and entrances opens `/emergency/report?loc=<qr_slug>` with the location prefilled. This is the most accurate and cheapest option.
2. **Browser geolocation** (asks permission, single reading at submit, never tracked). Indoors it is unreliable, so treat it only as a hint to preselect the nearest building.
3. **Manual picker** with search (uses `locations` + aliases).

Always ask the user to **confirm** the location before sending.

**After submit**
- Show the status stepper: *Received → Security acknowledged → Responding/Resolved*, updated by polling every 3-5 seconds.
- Show type-specific safety tips (fire: leave by the nearest exit, avoid lifts; medical: stay with the person, do not move them unless in danger).
- Tell the reporter: *"Security may call you on +91 98••••••21."*
- Show **Add details** so they can add description, photo or video after the report is already with responders.
- Never show internal review labels. Outcome messages are friendly (section 12.4).

**Wording to include on the page**
> "If in doubt, report it. Reports made in good faith are never penalized."
> "In immediate danger? Call 112 now."

### 7.2 UX checklist

- [ ] Works on a 360 px phone; tap targets at least 48 px; high contrast; never color-only.
- [ ] Icons carry meaning, so it works across languages. Provide UI translations for your students' main languages.
- [ ] Double-tap safe: the client generates `client_request_id` once per attempt; retries reuse it.
- [ ] On network failure: keep the form state, retry automatically, and show **"Call now"** immediately.
- [ ] Photo/video upload is optional, compressed client-side, and never blocks submission.
- [ ] Global **active-alert banner** in the root layout (section 11.5).
- [ ] "My reports" page with status timeline.

---

## 8. Rule-based triage (the safety floor)

The rule engine runs **synchronously** in the request handler. It needs no model and no network.

```ts
// lib/emergency/priority.ts
import cfg from "./emergency-config.json";

export type Priority = 1 | 2 | 3 | 4;           // 1 = most urgent

const BASE: Record<string, Priority> = {
  fire: 1, medical: 1, security_threat: 1, hazmat: 1, natural_disaster: 1,
  accident: 2, missing_person: 2, building_problem: 3, other: 3,
};

export function rulePriority(r: { type: string; text: string }): Priority {
  let p = BASE[r.type] ?? 3;
  if (matchesAny(r.text, cfg.p1Keywords)) p = 1;
  else if (p > 2 && matchesAny(r.text, cfg.p2Keywords)) p = 2;
  return p;
}

/** Lower number = more urgent. Every other source can only make this MORE urgent. */
export function finalPriority(rule: Priority, ml: Priority | null, corroboration: Priority | null): Priority {
  return Math.min(rule, ml ?? rule, corroboration ?? rule) as Priority;
}
```

`emergency-config.json` (editable by admins):

```json
{
  "p1Keywords": ["unconscious", "not breathing", "collapsed", "bleeding", "seizure", "trapped",
                 "weapon", "gun", "knife", "attack", "explosion", "gas leak", "smoke", "fire"],
  "p2Keywords": ["injured", "fell", "fracture", "sparks", "flooding", "missing", "threat"],
  "lifeSafetyTypes": ["fire", "medical", "security_threat", "hazmat", "natural_disaster"],
  "ackMinutes": { "1": 2, "2": 5, "3": 30, "4": 120 }
}
```

Add your students' regional-language words **and romanized spellings** (the way people actually type them) to both keyword lists. Keywords match whole words, case-insensitive, with simple normalization for common typos.

The final priority is **always the minimum** (most urgent) of rule, ML and corroboration. Nothing in the system can raise the number (lower urgency) after the rule engine sets it, except a human on the console.

---

## 9. ML / AI layer

### 9.1 What ML does here

| Assist | Method | Output goes to | Can it affect priority? |
|---|---|---|---|
| Type check | Multilingual embeddings vs type prototypes | "Mismatch" chip for reviewer | Can **raise** if text indicates a life-safety type |
| Location extraction | Fuzzy match against `locations` + aliases | Suggested location chip | No |
| Incident grouping | Embedding + type + location + time | Incident linking, `distinct_reporters` | Corroboration can **raise** |
| Spam / repeat signals | Heuristics (later a small model) | Reviewer context only | **No** |
| Priority assist | Rules + corroboration (ML classifier later) | Console sort order | Raise only |
| Summary | LLM over the incident's report texts | Console summary | No |
| Translation | LLM, labeled "machine translation" | Console | No |
| Image hints | CLIP zero-shot | Chips beside media | Raise attention only above a high threshold |

### 9.2 AI service endpoints

Add a router to the existing FastAPI service.

```python
# ai-service/emergency.py
import os
import numpy as np
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

router = APIRouter(prefix="/emergency")
embed = SentenceTransformer("intfloat/multilingual-e5-small")   # 384-d; needs "query: " prefix

# Add phrases in your students' languages and romanized forms. More phrases = better recall.
TYPE_PROTOTYPES = {
    "fire":             ["fire in the building", "smoke is coming out", "something is burning"],
    "medical":          ["a student collapsed", "someone is unconscious", "person is bleeding badly"],
    "accident":         ["a road accident happened", "someone fell down the stairs", "two vehicles collided"],
    "security_threat":  ["a man with a weapon", "someone is attacking students", "suspicious person with a bag"],
    "natural_disaster": ["flood water is entering", "strong earthquake tremor", "tree fell during the storm"],
    "hazmat":           ["chemical spill in the lab", "gas leak smell", "toxic fumes in the room"],
    "building_problem": ["ceiling is collapsing", "electrical sparks from the wall", "water pipe burst"],
    "missing_person":   ["student is missing since morning", "cannot find my friend", "child is lost on campus"],
}
PROTO_TEXTS, PROTO_TYPES = [], []
for t, phrases in TYPE_PROTOTYPES.items():
    for p in phrases:
        PROTO_TEXTS.append("query: " + p)
        PROTO_TYPES.append(t)
PROTO_EMB = embed.encode(PROTO_TEXTS, normalize_embeddings=True)
TYPE_IDX = {t: [i for i, x in enumerate(PROTO_TYPES) if x == t] for t in TYPE_PROTOTYPES}

MISMATCH_MIN, MARGIN = 0.80, 0.04      # calibrate on your evaluation set


class AnalyzeIn(BaseModel):
    text: str
    reported_type: str


def check(auth: str):
    if auth != f"Bearer {os.environ['AI_SERVICE_TOKEN']}":
        raise HTTPException(401)


@router.post("/analyze")
def analyze(body: AnalyzeIn, authorization: str = Header(...)):
    check(authorization)
    emb = embed.encode("query: " + body.text, normalize_embeddings=True)
    sims = PROTO_EMB @ emb
    per_type = {t: float(sims[idx].max()) for t, idx in TYPE_IDX.items()}
    ranked = sorted(per_type.items(), key=lambda kv: -kv[1])
    top_type, top_score = ranked[0]
    reported_score = per_type.get(body.reported_type, 0.0)
    mismatch = (top_type != body.reported_type
                and top_score >= MISMATCH_MIN
                and top_score - reported_score >= MARGIN)
    return {
        "text_emb": emb.tolist(),
        "type_suggestions": [{"type": t, "score": round(s, 3)} for t, s in ranked[:3]],
        "type_mismatch": mismatch,
    }
```

E5 models produce high baseline cosines even for unrelated text, so **thresholds must be calibrated** on your labeled set. Do not trust the numbers above.

Image hints (`/emergency/image-hints`) reuse the CLIP model from Lost & Found:

```python
HINT_PROMPTS = {
    "smoke":        "a photo of smoke",
    "fire":         "a photo of a fire",
    "person_down":  "a photo of a person lying on the ground",
    "flooding":     "a photo of a flooded floor",
    "damage":       "a photo of a damaged building or collapsed ceiling",
    "none":         "a photo of an ordinary room",
}
# Encode prompts once at startup; for an uploaded frame compute cosine to each prompt,
# softmax with temperature, return the top 2 labels with scores. Display as chips only.
```

### 9.3 Location extraction (worker, TypeScript)

The structured picker is the primary source. Extraction helps when someone writes "near Room 204, main block" or confirms a different place than the geolocation suggested.

```ts
// lib/emergency/locations.ts
import Fuse from "fuse.js";

// aliases = locations.name + location_aliases.alias, each with locationId (cache, refresh hourly)
const fuse = new Fuse(aliases, { keys: ["text"], threshold: 0.3, includeScore: true });

export function extractLocations(text: string) {
  const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const found = new Map<number, number>();                       // locationId -> best score
  for (let n = 4; n >= 1; n--) {                                 // try longer phrases first
    for (let i = 0; i + n <= words.length; i++) {
      const hit = fuse.search(words.slice(i, i + n).join(" "), { limit: 1 })[0];
      if (hit && (hit.score ?? 1) < 0.25) found.set(hit.item.locationId, 1 - (hit.score ?? 0));
    }
  }
  return [...found].map(([locationId, confidence]) => ({ locationId, confidence }))
                   .sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
```

If the extracted location differs from the chosen one, show a **"Text mentions Block B, report says Block A"** chip to the reviewer. Never overwrite the reporter's location automatically.

### 9.4 Incident clustering

When a report finishes enrichment (and again if details are added), link it to an incident.

`emergency-config.json` (cluster section):

```json
{
  "cluster": {
    "window_minutes": 60,
    "weights": { "text": 0.35, "type": 0.20, "location": 0.30, "time": 0.15 },
    "text_range": [0.75, 0.95],
    "attach_threshold": 0.65,
    "time_half_life_minutes": 20,
    "type_compat": { "fire:hazmat": 0.6, "accident:medical": 0.7, "fire:building_problem": 0.4 },
    "corroboration": { "distinct_reporters": 3, "within_minutes": 10 }
  }
}
```

Location affinity (hierarchy-aware):

| Relationship | Affinity |
|---|---|
| Same room / same point | 1.0 |
| Same floor | 0.9 |
| Same building | 0.8 |
| Same zone | 0.5 |
| Within 200 m (if coordinates exist) | 0.4 |
| Otherwise | 0 |

```ts
// lib/emergency/cluster.ts
export async function assignToIncident(reportId: string) {
  const r = await loadReport(reportId);
  const cands = await prisma.$queryRaw<Cand[]>`
    SELECT x.id, x.incident_id, x.type, x.location_id, x.created_at,
           CASE WHEN ${r.textEmb}::vector IS NULL OR x.text_emb IS NULL THEN NULL
                ELSE 1 - (x.text_emb <=> ${r.textEmb}::vector) END AS text_cos
    FROM emergency_reports x
    WHERE x.id <> ${r.id}
      AND x.is_drill = ${r.isDrill}
      AND x.incident_id IS NOT NULL
      AND (x.status <> 'rejected' OR x.rejection_reason = 'duplicate')
      AND x.created_at > now() - make_interval(mins => ${cfg.cluster.window_minutes})
    ORDER BY x.created_at DESC
    LIMIT 50`;

  // best link score per incident
  const byIncident = new Map<string, number>();
  for (const c of cands) {
    const w = cfg.cluster.weights;
    const parts = {
      type:     typeCompat(r.type, c.type),
      location: await locationAffinity(r.locationId, c.location_id),
      time:     0.5 ** (minutesBetween(r.createdAt, c.created_at) / cfg.cluster.time_half_life_minutes),
    };
    let total = w.type * parts.type + w.location * parts.location + w.time * parts.time;
    let sum = w.type + w.location + w.time;
    if (c.text_cos !== null) {                       // no text yet? renormalize without it
      total += w.text * rescale(c.text_cos, cfg.cluster.text_range);
      sum += w.text;
    }
    const s = total / sum;
    byIncident.set(c.incident_id, Math.max(byIncident.get(c.incident_id) ?? 0, s));
  }

  const best = [...byIncident].sort((a, b) => b[1] - a[1])[0];
  const incidentId = best && best[1] >= cfg.cluster.attach_threshold
    ? best[0]
    : await createIncidentFor(r);

  await attachReport(r.id, incidentId);              // transaction: update counts, last_report_at
  await recomputeIncident(incidentId);               // distinct_reporters, corroboration, priority
  // If a second incident also scored near the threshold, flag "possible merge" on the console.
}
```

**Corroboration rules (`recomputeIncident`)**
- `distinct_reporters` counts **different people**. One person submitting five reports counts once.
- If `distinct_reporters >= 3` within 10 minutes: raise the incident priority by one level (never past P1). For life-safety types, set P1.
- Priority changes write an event and **page the security head**.
- Corroboration raises urgency. It **never** sends an alert by itself. A group of people can be wrong or coordinated, so a human still decides.

### 9.5 Spam and repeat signals (context for the reviewer only)

Computed in the worker and stored in `ml.spam`:

- Same user submitted several reports within a short time.
- Description is gibberish, only repeated characters, or contains abuse.
- Text is near-identical to a previous report that was confirmed malicious.
- Reporter's geolocation is far from the reported location (**display only**, because someone may legitimately report on behalf of a friend).
- Reporter has prior confirmed malicious reports (count, not a verdict).

These appear as small neutral chips in the console. They **never** block, delay, deprioritize or auto-reject.

### 9.6 Summaries and translation (LLM, optional, never on the critical path)

- **Input:** report texts (reporter IDs replaced by `Reporter A/B/C`), types, locations, timestamps. **No names, no phone numbers.**
- **Output:** 2-3 sentence summary, key facts, and any **discrepancies** between reports ("2 reports say Block B, 1 says Block C").
- Label it **"AI summary: verify against the reports"** and always show the source reports below it.
- Timeout of about 5 seconds. On failure, fall back to a template summary listing counts, type, and location.
- Translate regional-language or romanized reports for responders who cannot read them, labeled **"machine translation"**, with the original always visible.
- The LLM may **draft** alert text from a template and incident facts. A human edits and approves it. It is never auto-sent.

### 9.7 Guardrails (summary)

- ML failure = **no change in behavior** for responders.
- ML output is stored under `ml` and shown as hints with provenance.
- Final priority formula is `MIN(rule, ml, corroboration)`.
- No ML result writes `status`, `rejection_reason` or alert state.
- Thresholds live in config and are calibrated on the evaluation set (section 17.3).

---

## 10. Security console and verification workflow

### 10.1 Console layout

- **Live queue** (SSE): sorted by priority, then age. Columns: ref, type, location, priority, reports/people count, time since submitted, ack status.
- **Audible alarm** for any unacknowledged P1 (with a visible "audio on" control, since browsers need a user gesture to play sound).
- **Incident map** (Leaflet or floor plan) with pins colored by priority.
- **Incident detail:** summary, all linked reports, media with hint chips, spam/context chips, timeline, notes.
- **One-click actions:** Acknowledge · Call reporter (`tel:` link, logged) · Dispatch note · Verify · Reject (with reason) · Merge/Split · Set status.
- **Alert composer:** template, scope, audience, channels, preview, approve/send (section 11).
- **Degraded-mode banner** when SSE, AI service, worker or SMS gateway is unhealthy.

### 10.2 Handling a report

1. **Acknowledge.** Stops escalation timers and records who and when.
2. **Respond.** Call the reporter, dispatch a guard, check CCTV. This does not wait for verification.
3. **Decide:**
   - **Verify** the incident (sets incident `confirmed`), then optionally draft an alert.
   - **Reject** with a reason (section 12).
   - **Merge** into another incident if grouping missed it.
4. **Track** the incident to `resolved`, send an **all-clear** if an alert went out, add post-incident notes, then `closed`.

### 10.3 Verification checklist (shown on the console)

- Did a responder see it, or does CCTV show it?
- Do other independent reporters corroborate it?
- Is it still active (age of the newest report)?
- Which alert scope fits (section 11.1)?

---

## 11. Alerts

### 11.1 Scope guidance by type

| Type | Default scope | Notes |
|---|---|---|
| Medical | **Responders only** | Protect the patient's privacy; no public alert |
| Accident | Responders only | Audience alert only if roads/areas are blocked |
| Fire | Audience or campus-wide | Evacuation instructions + assembly point |
| Security threat | Campus-wide (critical) | Requires security head, or two responders |
| Natural disaster | Campus-wide | Advisory / warning / critical |
| Hazmat | Audience or campus-wide | "Avoid area" instructions |
| Building problem | Audience (via Notices) | Closures, relocation notices |
| Missing person | Responders + selected audience | Sharing a photo needs admin approval |

### 11.2 Templates (pre-written, no LLM needed in a crisis)

| Template | Text |
|---|---|
| Fire evacuation | `FIRE ALERT: {building}. Evacuate now by the nearest exit. Do not use lifts. Assemble at {assembly_point}. Need help? Call {security_number}.` |
| Shelter in place | `SECURITY ALERT: Stay where you are. Lock doors, stay quiet, silence phones. Do not go to {area}. Wait for the all-clear.` |
| Severe weather | `WEATHER WARNING: {summary}. Move indoors, stay away from windows and trees. Updates will follow.` |
| Hazmat | `HAZARD: Avoid {area}. Keep windows closed in nearby buildings. Follow staff instructions.` |
| Update | `UPDATE ({time}): {text}` |
| All clear | `ALL CLEAR: {incident} is resolved. Normal activity may resume.` |
| Drill prefix | `THIS IS A DRILL. ` prepended to every channel |

Store `title`, `body` and optional `translations` per template. Placeholders fill from the incident and from `locations.assembly_point`.

### 11.3 Approval rules

```ts
// lib/emergency/approvals.ts
export function approvalsOk(
  scope: "responders_only" | "audience" | "campus_wide",
  approvers: { id: number; role: string }[],
) {
  if (scope === "responders_only") return approvers.length >= 1;
  const hasHead = approvers.some(a => a.role === "security_head" || a.role === "admin");
  const distinct = new Set(approvers.map(a => a.id)).size;
  return hasHead || distinct >= 2;                  // head alone, or two different responders
}
```

The **drafter can approve** only if rules allow, but a second person is always a *different user*. Approvals are rows in `alert_approvals`, and approving twice by the same user does nothing.

### 11.4 Delivery

| Severity | Default channels |
|---|---|
| Critical | Banner + web push + **SMS** |
| Warning | Banner + web push (SMS optional) |
| Advisory | Banner + email |

- **Audience** is resolved from fields in `users` you already have: all, by role, by department, by hostel. Building-level targeting needs location data you probably do not have, so for v1 name the building in the text ("Avoid Block B") and send to the whole audience.
- Fan-out in batches (about 500 recipients per job), one `alert_deliveries` row per recipient per channel (`UNIQUE` prevents double sends).
- The SMS gateway returns delivery receipts; update `delivered`/`failed`. Retry failures once, then show them on the console.
- **India SMS rules** require pre-registered sender IDs and message templates (DLT). Start this registration early and confirm the details with your SMS provider, because approval takes time.
- Critical alerts cannot be opted out of. State that in the privacy notice.
- Messages go out in English plus the configured regional language(s).

### 11.5 Showing alerts on the website

- Root layout includes `<ActiveAlertBanner />`. For logged-in users it opens an SSE connection to `/api/emergency/alerts/stream` and falls back to polling `/api/emergency/alerts/active` every 15 seconds.
- Critical alerts render as a **full-screen modal** with instructions, "I'm safe" and "I need help" buttons (optional feature), and a call button.
- "Need help" opens a prefilled emergency report linked to the incident.
- Alerts also appear on the **Notices** page as a pinned item.

### 11.6 Updates, all-clear and drills

- Post `update` messages as the situation changes, and always an `all_clear` when the incident resolves.
- **Drill mode:** reports, incidents and alerts carry `is_drill = true`. Drill alerts are prefixed `THIS IS A DRILL`, go only to a configured test audience, and are excluded from statistics. Run drills regularly and review time-to-ack and time-to-alert afterwards.
- **Safety check** (optional, later): aggregate `alert_responses` into a "safe / need help / no response" count on the console.

---

## 12. False reports and misuse (fair process)

### 12.1 Outcomes when a reviewer closes a report without an incident

| Reason | Meaning | Recorded against the reporter? |
|---|---|---|
| `duplicate` | Same event already reported | No |
| `not_emergency` | Real problem but not urgent (suggest Complaints) | No |
| `false_good_faith` | Honest mistake (steam mistaken for smoke) | **No** |
| `false_malicious` | Deliberate prank or misuse | **Only after review below** |
| `test` | Test or drill | No |

### 12.2 Malicious-report review

```
Responder rejects as false_malicious + mandatory note
        |
        v
 misuse_reviews row (pending) ---> admin queue
        |
   Admin reviews the evidence (report, timeline, responder note)
        |
        +--> confirmed  --> recorded against the student ID; student notified with reason and appeal option
        +--> dismissed  --> report reclassified as false_good_faith; nothing recorded
```

- The system **never imposes consequences**. Any disciplinary step is handled by the college under its own policy, outside this software.
- The student can **appeal**; an admin other than the original reviewer decides (`appeal_outcome`).
- Show admins repeat patterns (for example 2 or more confirmed cases) as information.
- Use the record only for human review. It must not influence priority or acceptance of future reports (principle 5).

### 12.3 Admin view

Table of confirmed and pending cases: report ref, student ID, date, responder note, status, appeal state. Each open is written to `report_access_log`.

### 12.4 What the reporter sees

- Verified: "Thanks. Help was sent."
- Duplicate: "Thanks. This was already reported and is being handled."
- Not an emergency: "Thanks for letting us know. This has been passed to the right team." (link to Complaints)
- False, good faith: "Thanks for reporting. No issue, and you did the right thing."
- Malicious review: a neutral notice that the report is under review, with the process and appeal option. No accusation before the admin confirms.

---

## 13. Next.js implementation

### 13.1 File layout

```
src/
  app/
    emergency/
      page.tsx                      # hub: big report button, call bar, my recent reports
      report/page.tsx               # 2-step form (reads ?loc= QR slug)
      reports/[id]/page.tsx         # reporter view: status stepper, add details
      my-reports/page.tsx
      console/page.tsx              # responders, head, admin (live)
      console/incidents/[id]/page.tsx
      alerts/[id]/page.tsx          # compose, approve, delivery stats
      admin/page.tsx                # roster, config, templates, misuse reviews, audit, analytics
    api/emergency/
      reports/route.ts                      # POST create, GET mine
      reports/[id]/route.ts                 # GET (reporter or staff)
      reports/[id]/details/route.ts         # PATCH add description / media (reporter)
      reports/[id]/ack/route.ts
      reports/[id]/triage/route.ts          # verify | reject{reason,note}
      reports/[id]/reporter/route.ts        # reveal identity+phone (logged)
      incidents/route.ts  incidents/[id]/route.ts
      incidents/[id]/merge/route.ts  split/route.ts  status/route.ts
      incidents/[id]/alerts/route.ts        # draft
      alerts/[id]/approve/route.ts  send/route.ts  cancel/route.ts
      alerts/active/route.ts  alerts/stream/route.ts  alerts/[id]/respond/route.ts
      console/stream/route.ts               # SSE for responders
      admin/...                             # config, roster, misuse, analytics, audit
    layout.tsx                      # includes <ActiveAlertBanner />
  lib/emergency/
    auth.ts  priority.ts  cluster.ts  locations.ts  approvals.ts  state.ts
    events.ts (LISTEN/NOTIFY bus)  notify.ts  ai-client.ts  privacy.ts
    emergency-config.json
  workers/index.ts                  # registers Lost & Found and Emergency jobs
ai-service/emergency.py
```

### 13.2 API summary

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/emergency/reports` | member | Submit (idempotent), returns `201` fast |
| PATCH | `/api/emergency/reports/{id}/details` | reporter | Add description/media after submitting |
| GET | `/api/emergency/reports/{id}` | reporter / staff | Status (reporter sees a friendly view only) |
| POST | `/api/emergency/reports/{id}/ack` | responder+ | Acknowledge |
| POST | `/api/emergency/reports/{id}/triage` | responder+ | Verify or reject with reason |
| GET | `/api/emergency/reports/{id}/reporter` | responder+ | Identity + phone (logged) |
| GET | `/api/emergency/console/stream` | responder+ | SSE live updates |
| POST | `/api/emergency/incidents/{id}/alerts` | responder+ | Draft alert |
| POST | `/api/emergency/alerts/{id}/approve` | responder+ | Add approval |
| POST | `/api/emergency/alerts/{id}/send` | responder+ | Send once `approvalsOk` |
| GET | `/api/emergency/alerts/active` | member | Banner data |
| POST | `/api/emergency/alerts/{id}/respond` | member | "Safe" / "Need help" |

### 13.3 Create-report handler (critical path)

```ts
// app/api/emergency/reports/route.ts
export async function POST(req: Request) {
  const user = await requireUser();                              // identity from the session only
  const body = createReportSchema.parse(await req.json());       // zod: type, locationId, optional text/geo, clientRequestId

  // Soft limit: over the threshold we FLAG the report, we never block a possible emergency.
  const rate = await softLimit("emergency-create", user.id, { flagAbove: 10, perHours: 1 });
  if (rate.hardExceeded) {                                       // very high cap, abuse protection only
    return Response.json({ message: "Too many requests. If this is urgent, call 112 or Security now." }, { status: 429 });
  }

  const rule = rulePriority({ type: body.type, text: body.description ?? "" });

  const report = await prisma.$transaction(async (tx) => {
    const existing = await tx.emergencyReport.findUnique({
      where: { reporterId_clientRequestId: { reporterId: user.id, clientRequestId: body.clientRequestId } },
    });
    if (existing) return existing;                               // retry or double tap: same result

    const created = await tx.emergencyReport.create({
      data: {
        ...body, reporterId: user.id, publicRef: await nextRef(tx, "ER"),
        rulePriority: rule, priority: rule,
        flags: rate.flagged ? { rate_exceeded: true } : {},
      },
    });
    await logEvent(tx, { reportId: created.id, actorId: user.id, event: "submitted" });
    // wakes every open console immediately (delivered on commit)
    await tx.$executeRaw`SELECT pg_notify('emergency_events',
      ${JSON.stringify({ type: "report_created", id: created.id, priority: rule })})`;
    return created;
  });

  // After commit. Even if these enqueues fail, the sweeper (section 14) retries.
  await boss.send("notify-responders", { reportId: report.id }, { priority: 10 - rule });
  await boss.send("enrich-report", { reportId: report.id }, { priority: 5 - rule });

  return Response.json({ id: report.id, ref: report.publicRef, status: "submitted" }, { status: 201 });
}
```

### 13.4 Live updates (shared LISTEN connection + SSE)

```ts
// lib/emergency/events.ts  (one Postgres LISTEN connection per server process)
import { Client } from "pg";
import { EventEmitter } from "node:events";

const g = globalThis as any;
export const bus: EventEmitter = (g.__emBus ??= new EventEmitter().setMaxListeners(0));

async function listen() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  const retry = () => setTimeout(listen, 2000);
  c.on("error", retry);
  c.on("end", retry);
  c.on("notification", (m) => bus.emit("event", m.payload));
  await c.connect();
  await c.query("LISTEN emergency_events");
}
if (!g.__emListener) g.__emListener = listen();
```

```ts
// app/api/emergency/console/stream/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requireRole("responder", "security_head", "admin");
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: string) => controller.enqueue(enc.encode(`data: ${payload}\n\n`));
      bus.on("event", send);
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 15000);
      cleanup = () => { bus.off("event", send); clearInterval(ping); };
      req.signal.addEventListener("abort", () => { cleanup(); controller.close(); });
      send(JSON.stringify({ type: "connected" }));
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
```

On the client, `EventSource` reconnects automatically. After every reconnect, **refetch the full queue** so nothing missed during the gap is lost. If SSE fails repeatedly, fall back to polling every 5 seconds and show the degraded-mode banner. Long-lived connections need a self-hosted Node runtime, not a serverless platform.

### 13.5 Reporter identity reveal (logged)

```ts
// app/api/emergency/reports/[id]/reporter/route.ts
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const staff = await requireRole("responder", "security_head", "admin");
  const report = await prisma.emergencyReport.findUniqueOrThrow({
    where: { id: params.id },
    include: { reporter: { select: { campusId: true, name: true, phone: true, department: true } } },
  });
  await prisma.reportAccessLog.create({ data: { reportId: report.id, viewerId: staff.id, what: "identity" } });
  return Response.json(report.reporter);
}
```

The console shows reporter name masked until the responder clicks **Reveal** (so each look is deliberate and logged). The `tel:` call link also logs `phone`.

---

## 14. Background jobs (shared worker process)

| Job | Trigger | Does |
|---|---|---|
| `notify-responders` | report created | Resolve on-duty roster, send push + SMS (P1 and P2), set `responders_notified_at` |
| `enrich-report` | report created / details added | AI analyze, embeddings, location extraction, spam signals, cluster, recompute incident |
| `summarize-incident` | incident changes | LLM summary (5 s timeout, template fallback) |
| `escalation-check` | cron every 30 s | Unacknowledged reports past their SLA: page the next level, write events |
| `sweeper` | cron every 30 s | Reports with `responders_notified_at IS NULL` older than 10 s: re-enqueue `notify-responders`; stuck `enrichment_status = 'pending'`: retry or mark `skipped` |
| `deliver-alert-batch` | alert sent | Send one batch of SMS/push/email, update `alert_deliveries` |
| `delivery-reconcile` | cron every minute | Poll provider receipts, retry failed deliveries once |
| `incident-housekeeping` | cron hourly | Remind owners of incidents left `responding` too long |
| `retention` | cron daily | Delete media after the retention period (unless on legal hold) |
| `heartbeat` | cron every 15 s | Write worker liveness for the health check |

Job priority: pg-boss runs higher `priority` first, so P1 jobs jump the queue during a burst. Notifying responders is never delayed by enrichment.

---

## 15. Reliability and fail-safes

1. **The critical path has no AI, LLM or worker dependency for visibility.** The console reads the database and gets pushed updates via `NOTIFY`.
2. **Responder paging has a safety net.** If the post-commit enqueue fails or the worker is down, the sweeper retries. A report that nobody has acknowledged shows red on the console with an audible alarm.
3. **Heartbeat monitoring.** `/api/health` checks DB, worker heartbeat age, AI service and SMS gateway. An external monitor (on a different machine) pings it and SMSes an admin when it fails.
4. **Degraded-mode banner** on the console names what is down.
5. **Always-visible call options** on every emergency screen and in every error state.
6. **Idempotency** on submission via `client_request_id`, so flaky networks never create duplicates or lose a report.
7. **Soft rate limits** that flag rather than reject. The hard cap is only for runaway abuse.
8. **Burst handling.** A real incident produces many reports at once. The submit path does one insert and one notify, so p95 stays low. Enrichment is queued behind P1 notifications.
9. **SMS gateway redundancy.** If budget allows, configure a secondary provider and fail over automatically.
10. **Backups** of Postgres and media, and a documented manual fallback procedure (phone tree) if the whole system is down.
11. **Regular drills** to prove all of the above work.

---

## 16. Security and privacy

- Authenticate and authorize every route. Check role and ownership in the handler.
- A student sees only their own reports, and only a friendly status view. Never other people's reports, never review labels.
- Reporter identity and phone are visible to responders and admins only, **each access logged**.
- Alerts and notifications never contain reporter details, patient names or medical specifics.
- Media: allow-list types, verify magic bytes, size/duration caps, random file names, **strip EXIF GPS** (keep capture time in a field), serve only through authorized signed URLs, scan if you can. Media of injured people is sensitive: staff-only, shorter retention.
- AI service on a private network with a bearer token. The LLM receives text only, with names and phones removed.
- Append-only `report_events` and `report_access_log`. No updates or deletes from the app role.
- CSRF protection (SameSite cookies + origin check). Strict input validation (zod).
- Never write phone numbers, report text or media paths to plain application logs.
- Retention: define periods for reports, media and misuse records with your institution. Keep anonymized statistics afterwards.
- Personal data (names, phones, health-related incident details) falls under India's data-protection rules (DPDP Act). Collect only what you need, record the purpose in the privacy notice, and confirm specifics with your institution.

---

## 17. Testing

### 17.1 End-to-end scenarios (Playwright; all must pass)

1. Student submits a fire report with only type + location → it appears on the console within 2 seconds with priority P1; on-duty responder is notified.
2. **AI service down:** same report still appears, P1 notification still fires, `enrichment_status` ends `skipped`/`failed`, nothing else breaks.
3. **Worker down:** the report still appears on the console (read from DB); after the worker restarts, the sweeper notifies responders.
4. Three different students report "smoke", "fire!!" and "burning smell" at the same building → **one incident**, `distinct_reporters = 3`, priority raised, security head paged.
5. One student submits five reports → `distinct_reporters` stays 1, no corroboration escalation, spam chip shown.
6. Unacknowledged P1 for 2 minutes → head paged; 4 minutes → admin paged; alarm active.
7. Verify an incident → draft from template → campus-wide alert needs a head approval **or** two distinct responders → send → deliveries tracked per recipient.
8. Responders-only alert for a medical report sends no public notification.
9. `false_good_faith` rejection → no `misuse_reviews` row, friendly message to student.
10. `false_malicious` → misuse review created → admin confirms → student notified → appeal flow works → another admin decides.
11. A student cannot read another student's report, reporter identity, or console endpoints (403).
12. Double-submit with the same `client_request_id` → one report.
13. Drill report/alert is labeled `DRILL`, goes only to test audience, and is excluded from analytics.
14. All-clear message sent and the active banner disappears.
15. Reporter changes nothing about location, but text mentions another building → mismatch chip shown, location not overwritten.
16. QR link prefills the location; manual picker fallback works.
17. SSE drops → console reconnects and refetches; after repeated failures it falls back to polling with the degraded banner.
18. Alert content contains no reporter name or phone (assert on delivered payloads).
19. A user who previously had a confirmed malicious report submits a real report → it is handled at normal priority with no delay (context chip only).

### 17.2 Unit / API tests (Vitest)

`priority.ts` (keyword rules, `finalPriority` never returns less urgent than the rule), `approvals.ts` (every combination), `cluster.ts` scoring and corroboration, location extraction, state transitions, privacy filters, idempotency.

### 17.3 ML evaluation (Python script in `eval/`)

**Dataset (300-500 reports, hand-written with teammates and an LLM, then reviewed):**
- Each labeled with true type, true location, incident group, and true priority.
- Include short and vague texts ("fire!!"), typos, **regional languages and romanized versions**, mixed languages, and prank-style or exaggerated reports.
- Include groups of 2-5 reports about the same event, plus unrelated near-in-time reports at nearby places as hard negatives.

**Metrics**

| Task | Metric | Target mindset |
|---|---|---|
| Type check | Per-class recall, especially fire / medical / security / hazmat | Recall first; a missed hint is worse than an extra chip |
| Location extraction | Top-1 and top-3 accuracy against the true location | |
| Clustering | Pairwise precision/recall, adjusted Rand index, over-merge rate | Prefer splitting over wrongly merging distinct events |
| Priority | Share of true-P1 reports ending at P1 | **100% by construction** (rule floor); report over-triage rate separately |
| Summary | Human rating + a check that every fact appears in a source report | |

**Ablations** (your academic contribution): rules only vs rules + ML; single-language vs multilingual embeddings; text-only vs text+location+time clustering; with vs without image hints.

Costs are asymmetric: **a missed real emergency is far worse than an extra review**. Tune thresholds for recall, then inspect false positives. Calibrate `MISMATCH_MIN`, `MARGIN`, `text_range` and `attach_threshold` on one split and report on a held-out split.

### 17.4 Load and chaos

- Burst test: 200 reports in one minute for one location. Submit p95 under 1 second, one incident (or a small, sensible number), responders notified within seconds.
- Kill the AI service, the worker and the SSE listener in turn (the chaos list in section 15) and confirm the behavior described there.

---

## 18. Local development and deployment (additions to the Lost & Found setup)

- Add `ai-service/emergency.py` to the existing AI container (mind RAM: e5 + CLIP + YOLO + MiniLM loaded together).
- Register Emergency jobs in the same worker (`workers/index.ts`).
- Extra environment variables:

| Variable | Purpose |
|---|---|
| `SMS_PROVIDER_*`, `SMS_SENDER_ID`, `SMS_DLT_*` | Alert and paging SMS |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web push |
| `SECURITY_DESK_NUMBER`, `EMERGENCY_NUMBER` | Shown on every screen |
| `ALERT_TEST_AUDIENCE` | User IDs or group for drills |
| `LLM_API_KEY` (optional) | Summaries, translation, alert drafting |

- Self-host the web app on a Node runtime (SSE needs long-lived connections). Put it behind a proxy that does not buffer `text/event-stream` and allows long idle timeouts.
- Seed: `locations` (building > floor > room, with `assembly_point` and `qr_slug`), `location_aliases`, templates, roster, config, test users.
- Print QR codes for entrances, corridors, labs, hostels.

---

## 19. Build order (check off as you go)

**Phase 0: foundations**
- [ ] Extend `locations` (hierarchy, assembly points, QR slugs) and seed buildings, floors, rooms, aliases
- [ ] Migrations for section 6; roles `responder` and `security_head`
- [ ] Verified-phone requirement for staff; `requireRole` helpers; soft rate limiter

**Phase 1: critical path (no AI)**
- [ ] Report form (type + location, QR prefill, geolocation hint, picker)
- [ ] `POST /reports` with idempotency, rule priority, `NOTIFY`
- [ ] Console with SSE + polling fallback, audible alarm, acknowledge
- [ ] `notify-responders` job, duty roster, sweeper, escalation timers
- [ ] Reporter status page and "Add details"

**Phase 2: incidents and triage**
- [ ] Incident model, manual merge/split, status workflow
- [ ] Verify / reject with reasons; friendly reporter messages
- [ ] Reporter identity reveal with access log

**Phase 3: alerts**
- [ ] Templates, composer, scopes, approval rules, `alert_approvals`
- [ ] Delivery fan-out, banner + web push + SMS, receipts, all-clear
- [ ] Active-alert banner in the root layout, Notices pin
- [ ] Drill mode and test audience

**Phase 4: ML assist**
- [ ] `/emergency/analyze`, type mismatch chip, location extraction
- [ ] Clustering with corroboration and `distinct_reporters`
- [ ] Spam/repeat signals; image hints for media
- [ ] LLM summary and translation with fallbacks

**Phase 5: governance**
- [ ] Misuse review queue, appeal flow, admin pages
- [ ] Analytics (time-to-ack, time-to-alert, false rates, delivery rates)
- [ ] Audit views, retention job

**Phase 6: quality gate**
- [ ] E2E scenarios 1-19 green
- [ ] ML evaluation run, thresholds calibrated, ablation table filled
- [ ] Chaos and load tests (17.4)
- [ ] SMS DLT registration complete, external health monitor live
- [ ] Full drill with the real security team

---

## 20. Definition of done

- A report with only type + location reaches the console and the on-duty responders in seconds, with the AI service and LLM both switched off.
- An unacknowledged P1 escalates automatically and loudly.
- No ML component can lower a priority, delay, reject or broadcast anything (verified by tests).
- Campus-wide alerts always require a human approval (head alone, or two responders) and include delivery tracking and an all-clear.
- No alert or notification contains reporter identity or victim details.
- Every view of reporter identity or phone is logged.
- Good-faith mistakes leave no mark on the reporter; malicious cases require responder flag + admin confirmation + appeal path.
- A full drill passes with real responders, real SMS, and measured times.

---

## 21. Later improvements

- Train a priority/type classifier on your confirmed incidents (logistic regression or gradient boosting on embeddings), still raise-only.
- Voice reports (speech-to-text) and SMS-to-report fallback for poor connectivity.
- PWA offline queue so a report is saved and sent when the signal returns.
- Automated voice-call paging for unacknowledged P1.
- Integration with PA systems, digital signage and fire alarm panels via webhooks.
- Indoor positioning (Wi-Fi/BLE beacons) to target alerts by building.
- Post-incident review dashboard and automatic drill scoring.
- Cross-campus mutual-aid contacts (nearby hospital, fire station) stored with templates.
