# ARCHITECTURE.md — Smart Campus System Architecture

## 1. High-Level Architectural Diagram

```mermaid
flowchart TD
    subgraph Browser ["Client Layer (Browser)"]
        UI["Next.js React Client (apps/web)"]
    end

    subgraph AppLayer ["Next.js Server Layer (Server-Side Only)"]
        Routes["Route Handlers (/api/complaints/analyze)"]
        Actions["Server Actions"]
        SupabaseClient["Supabase Server Client"]
    end

    subgraph Module2 ["Module 2: Intelligence Layer"]
        Analyzer["analyzeComplaint() Entry Point"]
        Validator["Input Validation (Zod)"]
        AIProvider{"Provider Selection"}
        MockEngine["Deterministic Mock Engine"]
        GeminiEngine["Gemini AI Client (@google/genai)"]
        ClusterEngine["Similarity & Duplicate Clustering"]
    end

    subgraph Contracts ["Shared Contracts (@smart-campus/contracts)"]
        ReqContract["ComplaintAnalysisRequest"]
        ResContract["ComplaintAnalysisResponse"]
        SchemaRules["Zod Runtime Schemas"]
    end

    subgraph External ["External Infrastructure"]
        SupabaseDB[("Supabase PostgreSQL + RLS")]
        GeminiAPI["Google Gemini API"]
    end

     UI -->|"Submit Grievance"| Routes
     Routes -->|"Validate Payload"| SchemaRules
     Routes -->|"Deterministic text clustering"| ClusterEngine
     AnalyzeUI["Optional standalone analysis client"] --> Routes
     Routes -->|"analyzeComplaint(request)"| Analyzer
    Analyzer --> Validator
    Validator --> AIProvider
    AIProvider -->|"AI_PROVIDER=mock"| MockEngine
    AIProvider -->|"AI_PROVIDER=gemini"| GeminiEngine
    GeminiEngine -.->|"Server-side API Call"| GeminiAPI
    MockEngine --> ClusterEngine
    GeminiEngine --> ClusterEngine
    Analyzer -->|"Validated Response"| ResContract
    ResContract --> Routes
     Routes -->|"Save Canonical Complaint"| SupabaseClient
    SupabaseClient --> SupabaseDB
    Routes -->|"JSON Response"| UI
```

---

## 2. Module 3: Lost & Found Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Browser)"]
        LFUI["Lost & Found Web Client (apps/web/app/lost-and-found)"]
    end

    subgraph AppLayer ["Next.js Server Layer"]
        LFAPI["Lost & Found API Routes (/api/lost-found/*)"]
        DBClient["Supabase Server Client"]
    end

    subgraph Persistence ["Persistence Layer"]
        Postgres[("Supabase PostgreSQL + pgvector")]
    end

    subgraph AsyncWorker ["Background Worker (workers/lost-found-worker)"]
        Worker["Job Runner (process-item, explain-match, etc.)"]
    end

    subgraph AIService ["Stateless AI Microservice (services/lost-found-ai)"]
        FastAPI["FastAPI App (yolo11n, clip-ViT-B-32, all-MiniLM-L6-v2)"]
    end

    LFUI -->|"Report Item / Claim"| LFAPI
    LFAPI -->|"Persist Item / Claim"| DBClient
    DBClient --> Postgres
    LFAPI -.->|"Queue Background Job"| Worker
    Worker -->|"Poll Unprocessed Items"| Postgres
    Worker -->|"POST /analyze (Extract Embeddings)"| FastAPI
    FastAPI -->|"Return 384d & 512d Vectors"| Worker
    Worker -->|"Store Embeddings & Run pgvector Search"| Postgres
    Worker -->|"Create Matches & Send Notifications"| Postgres
    LFUI -->|"Browse Sanitized Items & Review Matches"| LFAPI
    LFAPI -->|"Read Guarded Data"| DBClient
```

---

## 3. Module 4: Emergency Alert System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Browser & Mobile)"]
        EmergencyUI["Emergency Control Center (/emergency)"]
        GlobalBanner["EmergencyBanner (AppShell Header)"]
    end

    subgraph AppLayer ["Next.js Server Layer (apps/web)"]
        EmergencyAPI["Emergency API Routes (/api/emergency/*)"]
        EmergencySvc["Emergency Service (Priority Scoring & Dispatch)"]
    end

    subgraph Contracts ["Shared Contracts (@smart-campus/contracts)"]
        EmergencyContracts["EmergencyReport & EmergencyAlert Schemas"]
    end

    subgraph Channels ["Multi-Channel Broadcast Simulation"]
        InApp["In-App Broadcast Feed"]
        Push["Push Notification Web Worker"]
        SMS["SMS Notification Provider"]
        Siren["Campus PA Siren Network"]
    end

    EmergencyUI -->|"Submit SOS Report / Broadcast"| EmergencyAPI
    GlobalBanner -->|"Poll Active Broadcasts & Check-In"| EmergencyAPI
    EmergencyAPI -->|"Validate Request"| EmergencyContracts
    EmergencyAPI --> EmergencySvc
    EmergencySvc -->|"Fan-Out Broadcast"| Channels
```

---

## 4. Monorepo Layer Responsibilities

| Layer / Workspace             | Path                             | Key Responsibilities                                                                                                             |
| :---------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Main App (CampusGram)**     | `apps/web`                       | Next.js App Router, campus portal, complaints UI (`/complaints`), Lost & Found UI (`/lost-and-found`), Emergency Center (`/emergency`), and API routes. |
| **Complaint Intelligence**    | `modules/complaint-intelligence` | Categorization, severity scoring, location/entity extraction, clustering, Gemini API calls. Pure logic, zero React dependencies. |
| **Lost & Found Intelligence** | `modules/lost-and-found`         | Multimodal matching score, state machine transitions, privacy sanitization, storage abstraction, and contract validations.       |
| **Emergency Alert System**    | `apps/web/lib/emergency` & contracts | Incident priority evaluation (P1-P4), 1-tap SOS triage, multi-channel broadcast dispatch console, and real-time safety banner.    |
| **Lost & Found AI Service**   | `services/lost-found-ai`         | Stateless Python FastAPI microservice running YOLO11n, CLIP, and MiniLM models.                                                  |
| **Lost & Found Worker**       | `workers/lost-found-worker`      | Node.js background process for async embedding generation, matching sweeps, and notification dispatch.                           |
| **Contracts**                 | `packages/contracts`             | TypeScript interfaces and Zod schemas shared across all modules (`complaint`, `posts`, `users`, `lost-and-found`, `emergency`).   |
| **Shared UI**                 | `packages/ui`                    | Common UI primitives (Button, Card, Badge) styled with Tailwind CSS and shadcn tokens.                                          |
| **Shared Utils**              | `packages/utils`                 | Pure utility functions (`cn`, custom errors, date formatters).                                                                   |
| **Shared Config**             | `packages/config`                | Shared TypeScript and ESLint configurations.                                                                                     |
| **Supabase**                  | `supabase/`                      | SQL migrations (`001` through `007`), seed data, and local configuration.                                                        |


---

## 3. Data Flow & Security Boundaries

1. **Client / Browser:**
   - Submits requests to internal Next.js API endpoints (`/api/complaints/analyze`).
   - Only has access to public environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - NEVER makes direct calls to Google Gemini.

2. **Next.js Server:**
   - Possesses `GEMINI_API_KEY` and optional `SUPABASE_SERVICE_ROLE_KEY`.
   - Validates incoming payload using `@smart-campus/contracts`.
   - Dispatches analysis to `analyzeComplaint(request)` from `@smart-campus/complaint-intelligence`.

3. **Complaint Intelligence Processing (Module 2):**
   - Strictly decoupled from Next.js UI components.
   - Operates in either **Mock** or **Gemini** mode based on `AI_PROVIDER` and available keys.
   - Always validates AI outputs against Zod schemas before returning to caller.

4. **Persistence & Data Ownership:**
   - Module 1 owns canonical complaint state (`public.complaints`).
    - The primary complaint submission path stores canonical complaint state and deterministic text-cluster fields. The standalone Module 2 analysis route returns validated analysis but is not currently invoked or persisted by complaint submission.
   - No parallel user or complaint tables are created by Module 2.

---

## 4. Institutional Identity & Authentication Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Faculty
    participant Client as Next.js Client
    participant AuthAPI as Auth API (/api/auth/*)
    participant IdentitySvc as Identity Service
participant Supabase as PostgreSQL (RLS / RPC)

    User->>Client: Enters Institutional ID (e.g. STU2026001)
    Client->>AuthAPI: POST /api/auth/lookup { institutionalId }
    AuthAPI->>IdentitySvc: lookupInstitutionalIdentity()
    IdentitySvc->>Supabase: rpc("lookup_institutional_identity")
    Note over Supabase: SECURITY DEFINER executes mask_phone()<br/>and aggregates tags & biodata
    Supabase-->>IdentitySvc: Safe Profile + Masked Phone (******0001)
    IdentitySvc-->>AuthAPI: InstitutionalLookupResponse
    AuthAPI-->>Client: Display Safe Profile & Masked Phone
    
    User->>Client: Clicks "Request OTP"
    Client->>AuthAPI: POST /api/auth/otp/send { institutionalId }
    AuthAPI->>IdentitySvc: requestLoginOtp()
    IdentitySvc->>IdentitySvc: generateAndSendOtp() (OTP_PROVIDER=mock)
    IdentitySvc-->>AuthAPI: { success: true, expiresIn: 300, mockOtp: "123456" }
    AuthAPI-->>Client: Challenge active
    
    User->>Client: Enters OTP ("123456")
    Client->>AuthAPI: POST /api/auth/otp/verify { institutionalId, otp }
    AuthAPI->>IdentitySvc: verifyLoginOtp()
    IdentitySvc-->>AuthAPI: { success: true, profile, sessionToken }
    AuthAPI-->>Client: Authenticated Application Session Loaded
```

---

## 5. Current Module 3 Realized Architecture (2026-10-09)

The original Module 3 diagram above describes the intended asynchronous worker
topology. The current web implementation also supports an inline processing path,
which is the active path when hosted Supabase is configured:

```mermaid
flowchart TD
    Browser["Lost & Found Browser UI"]
    Session["/api/auth/session\nHTTP-only application session"]
    Routes["Next.js Lost & Found Route Handlers"]
    Capabilities["Server-derived capabilities\nno ownership IDs in public UI"]
    Repo["apps/web/lib/lost-found/repository.ts"]
    Supabase["Hosted Supabase PostgreSQL + RLS\ncanonical persistence"]
    Inline["apps/web/lib/queue.ts\ninline process-item queue"]
    AI["FastAPI /analyze\nlocalhost:8000 in demo runtime"]
    Score["Weighted empirical score\nimage .20, text .45, category .15, location .10, time .10"]
    Match["Safe match projection\nclaim verification\nhandover lifecycle"]

    Browser --> Session
    Browser --> Routes
    Session --> Routes
    Routes --> Capabilities
    Routes --> Repo
    Repo --> Supabase
    Routes --> Inline
    Inline --> AI
    AI --> Score
    Score --> Supabase
    Supabase --> Match
    Match --> Browser
```

### Runtime interpretation

- The inline queue is not a new architecture; it is the existing web-side
  processing implementation and keeps hosted-Supabase items in the same canonical
  data store.
- `workers/lost-found-worker` remains an independent pg-boss deployment option.
  It expects a PostgreSQL connection (local default port `54322` or configured
  `DATABASE_URL`) and is not required for the current hosted web flow.
- `services/lost-found-ai` runs with deterministic mock models by default in the
  current local setup. Full YOLO/CLIP/MiniLM dependencies remain optional.
- The browser never decides identity or authorization. It renders server-provided
  capability booleans and the server repeats every authorization check.

### Module 3 security boundary

```text
Public item/match data
  = title + public description + non-sensitive image URL + empirical score

Authorized workflow data
  = claim evidence + decision controls + handover controls

Never public
  = reporter IDs, claimant IDs, decision-maker IDs, private descriptions,
    identifying marks, storage paths, raw database joins, direct contact data
```

The current implementation deliberately directs users to Campus Security instead
of fabricating contact details when no approved directory source is available.

### Identity Data Model

- **`departments`**: Normalized academic and administrative units (`code`, `name`, `is_active`).
- **`programs`**: Degrees offered (`code`, `name`, `degree`, `duration_years`, `department_id`).
- **`institutional_users`**: Master student/faculty records (`institutional_id`, `full_name`, `phone` (sensitive), `email`, `primary_role`, `linked_profile_id`).
- **`student_biodata`**: Academic metrics (`admission_year`, `graduation_year`, `academic_year`, `current_semester`, `section`).
- **`faculty_biodata`**: Professional metrics (`designation`, `department_id`, `joining_year`).
- **`institutional_user_tags`**: Many-to-many responsibility mappings (`CAS_COORDINATOR`, `DEPARTMENT_COORDINATOR`, `COURSE_COORDINATOR`, `CLASS_COORDINATOR`, `HOD`).
- **`institutional_otp_sessions`**: Time-limited challenge verification tracking.
