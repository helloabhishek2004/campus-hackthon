# Module 2: Complaint Intelligence Processing

## Developer Ownership

- Primary workspace: `modules/complaint-intelligence/`
- Documentation: `docs/modules/MODULE_2.md` & `modules/complaint-intelligence/README.md`

## Public API Boundary

```ts
export async function analyzeComplaint(
  request: ComplaintAnalysisRequest,
  options?: IntelligenceOptions,
): Promise<ComplaintAnalysisResponse>;
```

## Key Components

- **`src/ai/gemini.ts`**: Handles Gemini API calls with Google Gen AI SDK.
- **`src/ai/prompts.ts`**: System and user prompt definitions.
- **`src/clustering/match.ts`**: Similarity matching against existing candidate complaints.
- **`src/validation/input.ts`**: Validates request against `@smart-campus/contracts`.

## Development Guidelines

- Always preserve mock mode support so teammates are never blocked without API keys.
- Do not import React or web-specific libraries.
- Run `pnpm test` inside this module to verify changes.
