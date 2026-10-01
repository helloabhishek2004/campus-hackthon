# INTEGRATION_CONTRACT.md — Inter-Module Integration Specification

This document defines the strict communication protocol between **Module 1 (Campus Application)** and **Module 2 (Complaint Intelligence Processing)**.

Both modules import schemas and types from:

```ts
import {
  ComplaintAnalysisRequest,
  ComplaintAnalysisResponse,
  ComplaintAnalysisRequestSchema,
  ComplaintAnalysisResponseSchema,
} from "@smart-campus/contracts";
```

---

## 1. Request Contract: Module 1 → Module 2

### TypeScript Definition

```ts
export interface ComplaintAnalysisRequest {
  complaint_id: string;

  complainant?: {
    user_id?: string;
    department?: string;
    programme?: string;
    semester?: number;
    class?: string;
  };

  text: string;

  images?: ComplaintAttachment[];
  documents?: ComplaintAttachment[];

  requested_recipient?: {
    type?: string;
    scope?: string;
  };

  metadata?: {
    source?: string;
    created_at?: string;
  };
}
```

### Constraints & Validation Rules

- `complaint_id`: Required non-empty string identifier.
- `text`: Minimum 5 characters long.
- `images` / `documents`: Array of `{ id?, url, filename?, mime_type?, size_bytes? }`. URLs must be valid format.

---

## 2. Response Contract: Module 2 → Module 1

### TypeScript Definition

```ts
export interface ComplaintAnalysisResponse {
  success: boolean;
  complaint_id: string;

  processing: {
    status: "completed" | "failed";
    provider?: "gemini" | "mock";
    model?: string;
    processed_at?: string;
    duration_ms?: number;
  };

  analysis?: {
    category: ComplaintCategory;
    subcategory: string;
    title_summary: string;
    summary: string;
    severity: {
      level: "low" | "medium" | "high" | "critical";
      score: number; // 0.0 to 10.0
      urgency_reasoning: string;
    };
    location: {
      building?: string | null;
      floor?: string | null;
      room?: string | null;
      area?: string | null;
      raw_mention?: string | null;
    };
    entities: Array<{
      entity: string;
      type:
        "equipment" | "facility" | "person" | "location" | "datetime" | "other";
      description?: string;
    }>;
    suggested_recipient: {
      department: string;
      role?: string;
      confidence: number; // 0.0 to 1.0
      reasoning: string;
    };
    cluster_match?: {
      is_potential_duplicate: boolean;
      cluster_id?: string | null;
      confidence: number;
      similar_issues: Array<{
        complaint_id: string;
        title: string;
        similarity_score: number;
        status?: string;
        summary?: string;
      }>;
    };
    overall_confidence: number; // 0.0 to 1.0
    tags: string[];
  };

  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## 3. Standard Enums & Values

### Categories

`"infrastructure"`, `"academic"`, `"hostel"`, `"sanitation"`, `"security"`, `"administration"`, `"it_services"`, `"other"`

### Severity Levels

- `critical`: Immediate life-safety, fire hazard, or severe emergency disruption. Score 9.0–10.0.
- `high`: Major facility breakdown, widespread power/network failure. Score 7.0–8.9.
- `medium`: Standard operational fault (broken fan, projector malfunction). Score 4.0–6.9.
- `low`: Minor cosmetic or non-blocking request. Score 0.0–3.9.

### Complaint Statuses

`"submitted"`, `"under_review"`, `"in_progress"`, `"resolved"`, `"rejected"`

---

## 4. Error Handling Protocol

When processing cannot be completed:

- `success` MUST be set to `false`.
- `processing.status` MUST be set to `"failed"`.
- `error` MUST contain `code` (e.g. `INVALID_REQUEST_PAYLOAD`, `PROCESSING_FAILED`) and descriptive `message`.
- No unhandled runtime exceptions may cross the public function boundary.

---

## 5. Contract Versioning Guidelines

1. **Additive Updates:** Introducing optional fields to request or response does not require version bumping.
2. **Breaking Changes:** Any field removal, type alteration, or mandatory field addition requires a consensus agreement between Module 1 and Module 2 leads.
