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

## 2. Monorepo Layer Responsibilities

| Layer / Workspace       | Path                             | Key Responsibilities                                                                                                             |
| :---------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Main App**            | `apps/web`                       | Next.js App Router, page layouts, student/admin views, API route handlers.                                                       |
| **Intelligence Module** | `modules/complaint-intelligence` | Categorization, severity scoring, location/entity extraction, clustering, Gemini API calls. Pure logic, zero React dependencies. |
| **Contracts**           | `packages/contracts`             | TypeScript interfaces and Zod schemas shared across all modules (`ComplaintAnalysisRequest`, `ComplaintAnalysisResponse`).       |
| **Shared UI**           | `packages/ui`                    | Common UI primitives (Button, Card, Badge) styled with Tailwind CSS.                                                             |
| **Shared Utils**        | `packages/utils`                 | Pure utility functions (`cn`, custom errors, date formatters).                                                                   |
| **Shared Config**       | `packages/config`                | Shared TypeScript and ESLint configurations.                                                                                     |
| **Supabase**            | `supabase/`                      | SQL migrations, seed data, and local configuration.                                                                              |

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
