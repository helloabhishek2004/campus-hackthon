# Smart Campus — Project Context

> **This document is the primary context document for all developers and AI coding agents working on Smart Campus.**
>
> Read this before modifying the repository.
>
> When implementation details are unclear, prefer this document, the architecture documents, shared contracts, and existing code over assumptions.

---

# 1. Project Identity

**Project:** Smart Campus

**Type:** Integrated campus management and student/faculty platform

**Primary goal:** Build a unified campus platform that connects students, faculty, campus services, complaints, lost & found, institutional identity, and intelligent automation in one system.

The system is designed for a hackathon and therefore prioritizes:

* working end-to-end flows
* clear architecture
* fast development
* modularity
* explainability
* realistic mock data
* replaceable integrations
* strong privacy boundaries
* easy parallel development

The project should remain practical and understandable.

---

# 2. Core Objective

Smart Campus should provide a single digital campus experience where an authenticated student, faculty member, or authorized staff member can access campus services without manually creating a profile.

The system should use institutional identity as the foundation.

The high-level experience is:

```text
Institutional Identity
        ↓
Authentication
        ↓
Personalized Campus Portal
        ↓
┌───────────────┬──────────────────┬──────────────────┐
│ Campus Portal │ Complaint         │ Lost & Found     │
│ / Module 1    │ Intelligence      │ / Module 3       │
│               │ / Module 2        │                  │
└───────────────┴──────────────────┴──────────────────┘
        ↓
Shared Database + Contracts + Services
```

The platform should feel like **one product**, not three unrelated projects.

---

# 3. Hackathon Development Philosophy

## MOCK FIRST → REAL IMPLEMENTATION SECOND

This is a fundamental project rule.

When an external dependency, AI model, infrastructure component, API, SMS provider, or heavy service is not yet available:

> Build and validate the interface using deterministic mock behavior first.

Then replace the implementation behind the same interface.

Examples:

```text
Mock OTP
    ↓
Real SMS OTP
```

```text
Mock AI classification
    ↓
Gemini / real AI classification
```

```text
Mock embeddings
    ↓
Real CLIP / MiniLM embeddings
```

```text
Mock worker execution
    ↓
Real background processing
```

```text
Local/mock storage
    ↓
Supabase Storage / production storage
```

The contract should remain stable while the implementation changes.

---

# 4. Why Mock-First?

The team is developing multiple modules in parallel.

Waiting for every real service before development would block the entire team.

Mock-first development allows:

* UI development before backend completion
* API development before AI integration
* deterministic testing
* offline development
* faster debugging
* easier demonstrations
* independent module development

Mocks must be:

* deterministic
* documented
* replaceable
* clearly identified as mocks

Never silently present a mock implementation as a real production integration.

---

# 5. Product Principles

The project follows these principles.

## 5.1 One Campus Identity

There should be one institutional identity across the entire system.

Modules must NOT create their own user systems.

Use the shared institutional identity.

---

## 5.2 No Manual Profile Creation

Students and faculty should not manually create profiles.

Institutional information already exists.

Login is based on:

```text
Institutional ID
      ↓
Institutional directory lookup
      ↓
Registered phone
      ↓
OTP
      ↓
Authenticated session
      ↓
Institutional profile
```

---

## 5.3 Authentication Is Separate From Authorization

Authentication answers:

> Who has successfully logged in?

Authorization answers:

> What is this user allowed to do?

A user's identity and their responsibilities are separate concepts.

Example:

```text
User
 ├── primary role: student
 └── responsibilities:
       ├── CAS_COORDINATOR
       └── DEPARTMENT_COORDINATOR
```

Another:

```text
User
 ├── primary role: faculty
 └── responsibilities:
       ├── HOD
       └── COURSE_COORDINATOR
```

---

# 6. Institutional Identity Foundation

The institutional identity system is shared infrastructure.

It uses Supabase/PostgreSQL and Supabase Auth.

Core concepts include:

```text
auth.users
    ↓
public.profiles
    ↓
institutional_users
    ├── student_biodata
    ├── faculty_biodata
    └── institutional_user_tags
```

The current institutional foundation includes:

* departments
* programs
* institutional users
* student biodata
* faculty biodata
* responsibility tags
* simulated OTP sessions

There are deterministic mock institutional records for development and testing.

---

# 7. Login Flow

The intended login flow is:

```text
1. User opens application
        ↓
2. Enters institutional ID
        ↓
3. Server looks up institutional identity
        ↓
4. Server returns safe identity information
        ↓
5. Phone number is masked
        ↓
6. Mock OTP is sent/generated
        ↓
7. User enters OTP
        ↓
8. OTP is verified
        ↓
9. Authenticated session is created
        ↓
10. Institutional profile is loaded
        ↓
11. User enters personalized campus portal
```

The raw phone number must never be unnecessarily exposed to the browser.

OTP is currently simulated for the hackathon.

The OTP provider must remain replaceable.

---

# 8. Shared Identity Data

The institutional identity model contains concepts such as:

### Departments

Examples:

```text
CSE
ECE
EEE
MECH
CIVIL
IT
MBA
```

### Programs

Examples:

```text
B.Tech CSE
M.Tech CSE
B.Tech ECE
B.Tech Mechanical
B.Tech Civil
B.Tech IT
MBA
```

The exact authoritative values are defined by the database seed/catalog.

### Primary roles

```text
student
faculty
staff
admin
```

### Responsibility tags

```text
CAS_COORDINATOR
DEPARTMENT_COORDINATOR
COURSE_COORDINATOR
CLASS_COORDINATOR
HOD
```

Tags are many-to-many responsibilities.

Do not assume one user can have only one responsibility.

---

# 9. Project Architecture

The project is a pnpm monorepo.

High-level structure:

```text
smart-campus/
│
├── apps/
│   └── web/
│
├── modules/
│   ├── complaint-intelligence/
│   └── lost-and-found/
│
├── services/
│   └── lost-found-ai/
│
├── workers/
│   └── lost-found-worker/
│
├── packages/
│   ├── contracts/
│   ├── ui/
│   ├── utils/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── docs/
│
├── AGENTS.md
├── PROJECT_CONTEXT.md
├── ARCHITECTURE.md
├── INTEGRATION_CONTRACT.md
├── CONTRIBUTING.md
└── README.md
```

---

# 10. Module 1 — Campus Portal

## Owner

Developer A

## Location

```text
apps/web/
```

Module 1 owns the main user experience.

It is NOT a separate application.

---

## Module 1 Objective

Provide the main campus portal through which authenticated students/faculty interact with Smart Campus.

Expected areas include:

```text
Authentication
Dashboard
Complaints
Complaint tracking
Campus feed/posts
Profile
Navigation
Notifications
```

---

# 11. Module 1 — Authentication

Module 1 consumes the shared institutional identity system.

It should implement the user-facing flow:

```text
Enter institutional ID
        ↓
Lookup
        ↓
Show masked phone
        ↓
Request OTP
        ↓
Enter OTP
        ↓
Verify
        ↓
Authenticated session
        ↓
Dashboard
```

Do not create a separate user database.

Do not create a separate authentication system.

---

# 12. Module 1 — Dashboard

The dashboard should be personalized according to:

* user name
* primary role
* department
* program
* academic year
* responsibilities
* relevant campus information

The dashboard should not duplicate institutional identity data unnecessarily.

---

# 13. Module 1 — Complaint Interface

Module 1 owns the user experience for complaints.

Expected flow:

```text
Student
   ↓
Submit complaint
   ↓
Text + optional image + location
   ↓
Complaint Intelligence
   ↓
Analysis result
   ↓
Tracking/status
```

Module 1 owns:

* complaint form
* complaint list
* complaint detail
* complaint status UI
* user-facing tracking

Module 2 owns the intelligence processing.

---

# 14. Module 1 — Feed / Posts

Module 1 may provide a campus feed for:

* announcements
* posts
* campus information
* relevant updates

The feed is a portal concern, not an AI module concern.

---

# 15. Module 1 — Profile

The profile is automatically populated from institutional identity.

Users should not manually recreate institutional information.

Application-specific editable settings may be separate where appropriate.

---

# 16. Module 2 — Complaint Intelligence

## Owner

Developer B

## Location

```text
modules/complaint-intelligence/
```

Module 2 is a domain/AI processing module.

It should remain independent from the UI.

---

# 17. Module 2 — Objective

Transform complaint input into structured intelligence.

Input:

```text
Complaint text
+
Optional image
+
Optional location
```

Output may include:

```text
Category
Severity
Extracted location/entity
Image observations
Confidence
Manual-review signal
Duplicate similarity
```

---

# 18. Module 2 — Responsibilities

Module 2 may handle:

### Text understanding

Understand complaint descriptions.

### Category classification

Use a controlled taxonomy such as:

```text
road_damage
garbage
water_leakage
streetlight
electricity
drainage
building_damage
sanitation
security
other
```

The taxonomy must remain controlled and documented.

---

### Severity

Example:

```text
low
medium
high
critical
```

Severity is an application classification, not an absolute truth.

---

### Image intelligence

Extract useful information from complaint images.

---

### Location/entity extraction

Extract useful location references from text/image input.

---

### Duplicate detection

Potential duplicate complaints may consider:

```text
text similarity
location proximity
category similarity
```

---

### Confidence / manual review

Low-confidence results should be able to trigger manual review.

---

# 19. Module 2 — Architecture Rule

Module 2 should NOT own:

```text
React UI
Next.js pages
authentication
database ownership
user profiles
routing
```

It should expose stable processing interfaces.

The application should be able to call:

```text
input
  ↓
complaint intelligence
  ↓
structured output
```

---

# 20. Module 2 — AI Strategy

Use mock/deterministic processing before requiring external AI.

Example:

```text
AI_PROVIDER=mock
```

should allow:

* local development
* tests
* demos
* CI
* development without API keys

Real AI can later be enabled behind the same abstraction.

Never require a paid external AI API for basic local testing.

---

# 21. Module 3 — Lost & Found

## Owner

Developer C

## Locations

```text
modules/lost-and-found/
services/lost-found-ai/
workers/lost-found-worker/
apps/web/app/lost-and-found/
apps/web/app/api/lost-found/
```

Module 3 is a larger multimodal feature.

The current architecture separates:

```text
Next.js
    ↓
Domain logic
    ↓
FastAPI AI service
    ↓
Background worker
```

---

# 22. Module 3 — Objective

Build a campus Lost & Found system capable of:

* reporting lost items
* reporting found items
* browsing items
* multimodal matching
* match explanations
* claims
* verification
* controlled handover
* notifications
* security/custody operations
* privacy-preserving contact release

---

# 23. Module 3 — Item Lifecycle

The primary state machine is:

```text
processing
    ↓
open
    ↓
in_claim
    ↓
handover
    ↓
resolved
```

Other transitions include:

```text
open → expired
open → withdrawn
```

Illegal state transitions must be rejected.

The state machine should remain centralized.

---

# 24. Module 3 — Matching

Matching uses multiple signals.

Conceptual score:

```text
S =
  wI * image_similarity
+ wT * text_similarity
+ wC * category_similarity
+ wL * location_similarity
+ wTime * time_similarity
```

Baseline weights:

```text
image     = 0.45
text      = 0.25
category  = 0.10
location  = 0.10
time      = 0.10
```

Baseline match bands:

```text
high   >= 0.80
medium >= 0.65
```

These values are starting points.

They are NOT calibrated probabilities.

Do not present them as probability or certainty.

---

# 25. Module 3 — AI

The intended AI architecture includes:

```text
YOLO11n
    ↓
object detection

CLIP
    ↓
visual embeddings

MiniLM
    ↓
text embeddings
```

The AI service is:

```text
services/lost-found-ai/
```

It is stateless.

The AI service should not become the owner of application state.

---

# 26. Module 3 — Mock AI

Mock mode is required.

Development should work without downloading heavy ML models.

Mock implementations should return:

* deterministic embeddings
* deterministic classifications
* predictable object detection results
* valid response schemas

Then real models can replace them.

---

# 27. Module 3 — Background Processing

Slow work belongs in:

```text
workers/lost-found-worker/
```

Potential jobs include:

```text
process-item
explain-match
send-notification
claim-nudge
handover-nudge
expire-items
close-contact-windows
```

Do not introduce Redis/Kafka/etc. unless explicitly required.

The current design intentionally keeps infrastructure lightweight.

---

# 28. Module 3 — Privacy

Lost & Found contains sensitive information.

Never expose:

```text
phone
email
private descriptions
identifying marks
sensitive images
```

just because a match exists.

Contact information should only be revealed after:

```text
claim approval
+
authorization/consent
+
active contact window
```

Contact reveals must be auditable.

---

# 29. Shared Database

Supabase/PostgreSQL is the primary application database.

Database migrations belong under:

```text
supabase/migrations/
```

Do not manually modify the production database without a migration.

Do not create independent databases for individual modules unless explicitly approved.

---

# 30. Database Ownership

Shared database concepts include:

```text
institutional identity
departments
programs
profiles
```

Module-specific tables should remain logically separated.

Examples:

```text
complaints
posts
lost_found_items
lost_found_matches
lost_found_claims
```

Modules may reference the shared institutional identity.

They should not duplicate it.

---

# 31. Shared Contracts

Shared contracts live under:

```text
packages/contracts/
```

This is the communication boundary between modules.

Use:

```text
TypeScript
+
Zod
```

where appropriate.

Contracts should define:

* input schemas
* output schemas
* enums
* stable identifiers
* API payloads

---

# 32. Contract Change Rule

Shared contracts are sensitive.

Before changing a shared contract:

1. inspect all consumers
2. determine impact
3. preserve backwards compatibility where possible
4. update tests
5. document the change

Do not casually modify shared contracts for convenience.

---

# 33. API Ownership

Next.js API routes belong to the application layer.

Examples:

```text
/api/auth/*
/api/complaints/*
/api/lost-found/*
```

The API layer should:

* authenticate
* authorize
* validate input
* call domain/service logic
* return contract-compliant output

Do not put large domain algorithms directly inside route handlers.

---

# 34. Authentication Security

Never:

* store passwords manually
* expose raw phone numbers unnecessarily
* return OTPs from production APIs
* trust client-provided roles
* trust client-provided user IDs for authorization
* bypass Supabase session validation
* create separate auth systems inside modules

Always derive authenticated identity from the verified server-side session.

---

# 35. Mock Data Policy

The project uses mock data heavily during development.

Mock data should be:

* deterministic
* fictional
* realistic enough for demos
* reproducible
* clearly documented

Never use real student/faculty personal information.

---

# 36. Mock vs Production Boundary

Every mock integration should have a clear boundary.

Example:

```text
interface
   │
   ├── Mock implementation
   │
   └── Real implementation
```

The UI should not need to know whether the implementation is mocked.

Bad:

```text
if (mock) {
   fake something directly inside UI
}
```

Better:

```text
UI
 ↓
service interface
 ↓
mock / real implementation
```

---

# 37. Environment Variables

Use environment variables for external integrations.

Examples include:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OTP_PROVIDER
AI_PROVIDER
GEMINI_API_KEY
LOST_FOUND_AI_URL
```

Never commit secrets.

Never put server-only secrets into client-side code.

---

# 38. Repository Ownership

The team is divided into three primary development streams.

### Developer A

Owns:

```text
apps/web/
```

for Module 1 application experience.

### Developer B

Owns:

```text
modules/complaint-intelligence/
```

for Module 2 intelligence.

### Developer C

Owns:

```text
modules/lost-and-found/
services/lost-found-ai/
workers/lost-found-worker/
apps/web/app/lost-and-found/
apps/web/app/api/lost-found/
```

for Module 3.

---

# 39. Shared / Protected Areas

These areas require coordination:

```text
packages/contracts/
supabase/migrations/
supabase/seed/
packages/config/
root package.json
pnpm-workspace.yaml
ARCHITECTURE.md
PROJECT_CONTEXT.md
AGENTS.md
INTEGRATION_CONTRACT.md
```

Do not casually modify these files while working on a module.

---

# 40. Git Workflow

The shared baseline is maintained on:

```text
main
```

Feature branches:

```text
feature/module-1-portal
feature/module-2-intelligence
feature/module-3-lost-and-found
```

Developers should:

1. branch from the current `main`
2. work primarily inside their ownership boundary
3. commit focused changes
4. run tests before PR
5. open a PR
6. integrate through `main`

Do not force-push or rewrite shared history.

Do not automatically create/switch branches through AI coding agents.

---

# 41. Integration Philosophy

Modules should be independently testable but designed for integration.

The integration direction is:

```text
Shared Identity
      ↓
   Module 1
      ↓
 ┌────┴─────┐
 ↓          ↓
Module 2   Module 3
 ↓          ↓
AI         AI/Matching
```

Modules communicate through:

* shared contracts
* API boundaries
* stable IDs
* database relationships

Avoid direct imports across unrelated module internals.

---

# 42. What NOT To Build

This project is intentionally lightweight.

Do NOT introduce:

```text
Kubernetes
Kafka
Redis
MongoDB
microservice explosion
custom OAuth server
custom JWT infrastructure
multiple Next.js applications
separate databases per module
unnecessary event buses
```

unless explicitly requested later.

The architecture should remain hackathon-friendly.

---

# 43. Avoid Overengineering

Before adding a new abstraction, ask:

```text
Is this required by the current feature?
Can an existing abstraction solve it?
Does it make integration harder?
Does it increase deployment complexity?
Can it remain behind an interface?
```

Prefer the simplest architecture that satisfies the requirement.

---

# 44. Agent Development Rules

AI coding agents MUST:

1. Read this document before coding.
2. Inspect the existing repository before creating files.
3. Reuse existing abstractions.
4. Preserve existing architecture.
5. Follow module ownership boundaries.
6. Prefer mock implementations first.
7. Keep mocks deterministic.
8. Write tests for important logic.
9. Update documentation when architecture changes.
10. Run validation commands before declaring completion.

Agents MUST NOT:

* rewrite unrelated modules
* delete existing work
* create duplicate identity systems
* invent infrastructure
* silently change shared contracts
* introduce unnecessary dependencies
* claim tests passed without running them
* replace working architecture without justification

---

# 45. Before Implementing Anything

Every agent should answer internally:

```text
1. Which module owns this feature?
2. Is there already an implementation?
3. Is there already a shared contract?
4. Does this require a database change?
5. Is the database change shared infrastructure?
6. Can I implement this with a deterministic mock first?
7. Will this affect another developer's module?
8. What tests prove the change works?
```

If the answer to #7 is yes, inspect the integration contract before modifying shared infrastructure.

---

# 46. Definition of a Good Feature

A feature is not considered complete merely because the code compiles.

A good feature has:

```text
correct ownership
+
clear contract
+
validation
+
tests
+
mock implementation where appropriate
+
error handling
+
security boundaries
+
documentation
```

---

# 47. Development Priority

When implementing features, generally follow:

```text
1. Contract
2. Mock implementation
3. Domain logic
4. API boundary
5. UI
6. Real external integration
7. Integration tests
8. Polish
```

This order may change when a feature requires UI-first exploration, but the underlying interfaces should remain stable.

---

# 48. Testing Philosophy

Tests should be deterministic.

Prioritize:

### Unit tests

For:

* state machines
* scoring
* validation
* privacy rules
* classification logic
* utility functions

### Integration tests

For:

* API contracts
* authentication flow
* database interaction
* module boundaries

### End-to-end tests

For important user journeys.

Do not make tests depend unnecessarily on external APIs.

---

# 49. Local Development

The project should remain usable locally.

A developer should be able to work on their module without requiring every external service.

Prefer:

```text
mock AI
mock OTP
mock notifications
local Supabase
local storage adapter
```

where possible.

---

# 50. Error Handling

Errors should be explicit.

Do not silently:

```text
return fake success
```

when a real service fails.

Distinguish:

```text
mock mode
real mode
service unavailable
invalid input
unauthorized
forbidden
not found
validation failure
```

---

# 51. Observability

Important operations should produce useful logs in development.

Never log:

```text
OTP values
full phone numbers
passwords
service-role keys
private descriptions
sensitive images
```

Logs should help developers diagnose failures without exposing sensitive data.

---

# 52. Privacy by Default

When uncertain whether data should be exposed:

> expose the minimum required.

Examples:

```text
Public Lost & Found catalog
    ↓
sanitized information

Authenticated user
    ↓
their own private information

Authorized staff
    ↓
additional operational information

Approved claim
    ↓
controlled contact information
```

---

# 53. Current Project State

The project already contains foundational work for:

```text
✓ pnpm monorepo
✓ Next.js web application
✓ shared contracts
✓ Supabase database foundation
✓ institutional identity
✓ simulated OTP foundation
✓ Module 2 complaint intelligence
✓ Module 3 Lost & Found foundation
✓ FastAPI AI service skeleton
✓ Lost & Found worker skeleton
✓ shared documentation
✓ automated validation
```

Do not recreate these foundations.

Build on them.

---

# 54. Current Major Modules

## Module 1

```text
Campus Portal
```

Primary concern:

```text
user experience
authentication UI
dashboard
complaints UI
tracking
feed
profile
```

---

## Module 2

```text
Complaint Intelligence
```

Primary concern:

```text
AI processing
classification
severity
image intelligence
location extraction
duplicate detection
confidence
```

---

## Module 3

```text
Lost & Found
```

Primary concern:

```text
item reporting
multimodal matching
verification
claims
handover
privacy
notifications
campus custody
```

---

# 55. Cross-Module Example

A typical complaint journey:

```text
Student
  ↓
Module 1
  ↓
Submit complaint
  ↓
Shared API/contract
  ↓
Module 2
  ↓
AI analysis
  ↓
Category
Severity
Location
Confidence
Duplicate signal
  ↓
Module 1
  ↓
Display status/result
```

A typical Lost & Found journey:

```text
Student
  ↓
Module 1 / Lost & Found UI
  ↓
Create lost/found item
  ↓
Module 3 domain
  ↓
Worker
  ↓
AI service
  ├── YOLO
  ├── CLIP
  └── MiniLM
  ↓
Matching
  ↓
Candidate match
  ↓
Claim
  ↓
Verification
  ↓
Approved handover
  ↓
Controlled contact reveal
  ↓
Resolved
```

---

# 56. The Product Must Remain One System

Although development is divided into modules, users should experience:

```text
ONE Smart Campus
```

not:

```text
Application 1
Application 2
Application 3
```

Therefore:

* shared identity
* shared navigation
* shared UI language
* shared contracts
* shared database
* shared authorization model

should be preferred.

---

# 57. When Requirements Are Ambiguous

Do not invent a large solution.

First:

```text
inspect existing code
↓
inspect contracts
↓
inspect database
↓
inspect module documentation
↓
choose smallest compatible implementation
```

If still ambiguous:

* document the assumption
* choose the least disruptive approach
* keep the implementation replaceable

---

# 58. Final Agent Rule

The most important rule in this repository is:

> **Extend the existing Smart Campus architecture; do not reinvent it.**

Before adding code, understand:

```text
WHO owns it?
WHAT is the contract?
WHERE does it belong?
HOW is it tested?
WHAT is mocked?
WHAT is real?
WHAT data is sensitive?
WHO else depends on it?
```

If an implementation makes one module work but makes integration harder for the other modules, reconsider the implementation.

The goal is not to build three impressive isolated modules.

The goal is to build **one coherent Smart Campus system**.

---

# 59. Success Criteria

The project succeeds when:

```text
Student/Faculty
      ↓
Institutional ID
      ↓
Mock OTP
      ↓
Authenticated Session
      ↓
Campus Portal
      ↓
┌───────────────────────────────┐
│ Complaints                    │
│ AI Complaint Intelligence     │
│ Lost & Found                  │
│ Campus Feed                   │
│ Profile                       │
└───────────────────────────────┘
      ↓
Shared secure infrastructure
```

and the architecture remains:

```text
simple
modular
testable
privacy-aware
mock-first
integration-friendly
hackathon-ready
```

---

# 60. Final Instruction to AI Agents

When working on this repository:

> **Do not drift from the project objective.**
>
> Build what the Smart Campus system needs.
>
> Prefer the existing architecture.
>
> Prefer shared contracts over duplicated logic.
>
> Prefer deterministic mocks before external integrations.
>
> Prefer simple solutions over infrastructure-heavy solutions.
>
> Respect module ownership.
>
> Protect institutional and personal data.
>
> Test before claiming completion.
>
> Keep the system coherent.

**Smart Campus is one product with three major development modules, not three independent applications.**
