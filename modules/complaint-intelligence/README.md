# Module 2 — Complaint Intelligence Processing

## Overview

Module 2 is an independent domain service responsible for analyzing student and campus grievances. It processes unstructured text and attachments to extract actionable intelligence for dispatching and triaging.

## Responsibilities

- **Categorization & Subcategorization**: Identifies whether the complaint is infrastructure, academic, sanitation, hostel, security, IT services, etc.
- **Severity Scoring**: Analyzes safety, academic, or operational risk (levels: `low`, `medium`, `high`, `critical`).
- **Entity & Location Extraction**: Extracts mentions of buildings, floors, rooms, facilities, and equipment.
- **Recipient Routing**: Recommends the responsible campus department and administrative role.
- **Cluster & Duplicate Matching**: Compares new complaints against active issues to detect duplicates and cluster shared grievances.

## Integration & Boundary

- **Input Contract**: `ComplaintAnalysisRequest` from `@smart-campus/contracts`
- **Output Contract**: `ComplaintAnalysisResponse` from `@smart-campus/contracts`
- **Public Entry Point**:
  ```ts
  import { analyzeComplaint } from "@smart-campus/complaint-intelligence";
  import type {
    ComplaintAnalysisRequest,
    ComplaintAnalysisResponse,
  } from "@smart-campus/contracts";

  const response: ComplaintAnalysisResponse = await analyzeComplaint(request);
  ```

## AI Modes & Mock Support

To enable independent development without Gemini API credentials:

1. **Mock Mode (Default when no key)**: Returns deterministic, rule-based responses matching the full JSON contract schema. Set `AI_PROVIDER=mock`.
2. **Gemini Mode**: Calls Google Gemini using the official `@google/genai` SDK. Set `AI_PROVIDER=gemini` and provide `GEMINI_API_KEY`. All model output is strictly validated using Zod against `ComplaintAnalysisSchema`.

## Internal Structure

```text
src/
├── ai/           # Gemini client, system/user prompts, schema enforcement
├── analysis/     # Classification, severity, location, and entity parsers
├── clustering/   # Similarity algorithms and duplicate candidate search
├── validation/   # Zod contract input validator
├── types/        # Exported module types
└── index.ts      # Public API entry point
```

## Running Tests

```bash
pnpm --filter @smart-campus/complaint-intelligence test
```
