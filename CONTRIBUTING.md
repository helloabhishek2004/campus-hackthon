# CONTRIBUTING.md — Smart Campus Monorepo Developer Guide

## 1. Quick Start

### Prerequisites

- Node.js (v20+ or v24+)
- `pnpm` (v9+ or v12+)
- Git

### Installation & Local Setup

```bash
# 1. Clone & install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start development server
pnpm dev
```

The portal will be accessible at `http://localhost:3000`.

---

## 2. Git & Feature Branch Workflow

Never commit major features directly to `main`.
Always branch from `main`:

```bash
git checkout -b feature/module-2-clustering
# work on code...
git add .
git commit -m "feat(module-2): implement jaccard duplicate detection"
git push origin feature/module-2-clustering
```

### Commit Convention

Format: `<type>(<scope>): <short description>`

- `feat(module-1)`: Add campus feed filter
- `feat(module-2)`: Add image attachment analysis
- `feat(contracts)`: Add urgency reasoning field
- `fix(module-2)`: Correct JSON extraction regex
- `test(module-2)`: Add edge case clustering test
- `docs`: Update integration notes

---

## 3. Standard Commands

| Command          | Action                                  |
| :--------------- | :-------------------------------------- |
| `pnpm dev`       | Starts the Next.js development server   |
| `pnpm build`     | Builds all packages and the Next.js app |
| `pnpm lint`      | Runs ESLint across all workspaces       |
| `pnpm typecheck` | Type-checks all TypeScript projects     |
| `pnpm test`      | Runs Vitest unit & integration tests    |
| `pnpm format`    | Formats all files using Prettier        |

---

## 4. Making Database Changes (Supabase)

All database schema modifications MUST be captured as SQL migrations:

1. Create a new file in `supabase/migrations/` (e.g. `002_add_feedback.sql`).
2. Add your DDL statements with appropriate RLS policies.
3. Update `packages/contracts` if TypeScript models or Zod schemas change.

---

## 5. Updating Shared Contracts

Before modifying `packages/contracts`:

1. Check with developers working on other modules.
2. Maintain backward compatibility (prefer adding optional properties over renaming existing ones).
3. Run `pnpm -r typecheck` to verify that no module was inadvertently broken.
