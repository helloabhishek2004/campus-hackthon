# ADR-003: Strict Module Boundaries & Shared Contracts

## Context

Independent developers working in parallel often encounter integration friction due to conflicting data structures, divergent naming conventions (`complaint_id` vs `id`), and tight coupling between AI logic and frontend components.

## Decision

1. All inter-module request/response types and runtime validation schemas live in `packages/contracts`.
2. Module 2 exposes only a clean, pure TypeScript API: `analyzeComplaint(request, options)`.
3. Module 2 contains zero UI code and can run independently in mock mode or with Google Gemini.
4. AI outputs are strictly validated at runtime with Zod prior to returning.

## Consequences

- Developers can work without blocking each other.
- Module 1 can run tests and develop UI completely offline using deterministic mock analysis.
- Integration requires zero refactoring of business logic.
