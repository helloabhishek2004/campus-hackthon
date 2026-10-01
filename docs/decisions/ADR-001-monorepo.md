# ADR-001: Use pnpm Monorepo Architecture

## Context

Multiple developers are building Smart Campus concurrently during a hackathon (Module 1: Campus Portal, Module 2: Complaint Intelligence). We need a codebase structure that isolates domain logic, enables independent testing, and eliminates multi-repository synchronization overhead.

## Decision

Adopt a single Git repository organized as a `pnpm` monorepo:

- `apps/web` for the user interface and server routes.
- `modules/complaint-intelligence` for decoupled AI processing.
- `packages/contracts` for shared schemas and types.
- `packages/ui` and `packages/utils` for reusable components.

## Consequences

- Fast cross-package linking without publishing to npm.
- Single source of truth for TypeScript types and Zod schemas.
- Eliminates dependency drift and enables atomic commits.
