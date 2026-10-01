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
    Routes -->|"Save Canonical Complaint & AI Result"| SupabaseClient
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

## 3. Monorepo Layer Responsibilities

| Layer / Workspace             | Path                             | Key Responsibilities                                                                                                             |
| :---------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Main App**                  | `apps/web`                       | Next.js App Router, campus portal, complaints UI, Lost & Found UI (`/lost-and-found`), and API routes.                           |
| **Complaint Intelligence**    | `modules/complaint-intelligence` | Categorization, severity scoring, location/entity extraction, clustering, Gemini API calls. Pure logic, zero React dependencies. |
| **Lost & Found Intelligence** | `modules/lost-and-found`         | Multimodal matching score, state machine transitions, privacy sanitization, storage abstraction, and contract validations.       |
| **Lost & Found AI Service**   | `services/lost-found-ai`         | Stateless Python FastAPI microservice running YOLO11n, CLIP, and MiniLM models.                                                  |
| **Lost & Found Worker**       | `workers/lost-found-worker`      | Node.js background process for async embedding generation, matching sweeps, and notification dispatch.                           |
| **Contracts**                 | `packages/contracts`             | TypeScript interfaces and Zod schemas shared across all modules (`complaint`, `posts`, `users`, `lost-and-found`).               |
| **Shared UI**                 | `packages/ui`                    | Common UI primitives (Button, Card, Badge) styled with Tailwind CSS.                                                             |
| **Shared Utils**              | `packages/utils`                 | Pure utility functions (`cn`, custom errors, date formatters).                                                                   |
| **Shared Config**             | `packages/config`                | Shared TypeScript and ESLint configurations.                                                                                     |
| **Supabase**                  | `supabase/`                      | SQL migrations (`001_initial_schema.sql`, `002_lost_and_found.sql`), seed data, and local configuration.                         |

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
   - AI outputs are stored in `public.complaint_ai_analysis` referencing `complaints.id`.
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

### Identity Data Model

- **`departments`**: Normalized academic and administrative units (`code`, `name`, `is_active`).
- **`programs`**: Degrees offered (`code`, `name`, `degree`, `duration_years`, `department_id`).
- **`institutional_users`**: Master student/faculty records (`institutional_id`, `full_name`, `phone` (sensitive), `email`, `primary_role`, `linked_profile_id`).
- **`student_biodata`**: Academic metrics (`admission_year`, `graduation_year`, `academic_year`, `current_semester`, `section`).
- **`faculty_biodata`**: Professional metrics (`designation`, `department_id`, `joining_year`).
- **`institutional_user_tags`**: Many-to-many responsibility mappings (`CAS_COORDINATOR`, `DEPARTMENT_COORDINATOR`, `COURSE_COORDINATOR`, `CLASS_COORDINATOR`, `HOD`).
- **`institutional_otp_sessions`**: Time-limited challenge verification tracking.
