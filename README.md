# Smart Campus — Monorepo & AI Multi-Agent Platform

A modern, modular campus information and grievance intelligence system built for rapid, parallel hackathon development.

---

## 🏛️ Architecture Overview

```text
smart-campus/
├── apps/
│   └── web/                               # Next.js App Router, Frontend & Server Handlers
├── modules/
│   └── complaint-intelligence/            # Module 2: AI Grievance Classification & Triage
├── packages/
│   ├── contracts/                         # Shared TypeScript types & Zod validation schemas
│   ├── ui/                                # Reusable UI components (Tailwind + Lucide)
│   ├── config/                            # Shared TypeScript & ESLint configs
│   └── utils/                             # Shared utility functions (cn, error helpers)
├── supabase/
│   ├── migrations/                        # PostgreSQL DDL migrations & RLS
│   ├── seed/                              # Test seed data
│   └── config.toml                        # Local Supabase configuration
├── docs/                                  # Project documentation & ADRs
├── AGENTS.md                              # AI pair-programming manual
├── PROJECT_CONTEXT.md                     # Domain context & requirements
├── ARCHITECTURE.md                        # Complete technical architecture
└── INTEGRATION_CONTRACT.md                # Inter-module contract specifications
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** v20+ or v24+
- **pnpm** v9+ or v12+

### 2. Setup

```bash
# Clone the repository and install all workspace dependencies
pnpm install

# Setup local environment
cp .env.example .env.local

# Run the development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the portal and test the live integration between `apps/web` and `modules/complaint-intelligence`.

---

## 🧪 Testing & Verification

```bash
# Run tests across workspaces
pnpm test

# Typecheck all TypeScript packages
pnpm typecheck

# Build the complete project
pnpm build
```

---

## 🛡️ AI Modes

Module 2 supports two operational modes:

- **Mock Mode (`AI_PROVIDER=mock`)**: Zero-configuration deterministic evaluation. Allows UI and module developers to work offline without a Google Gemini API key.
- **Gemini Mode (`AI_PROVIDER=gemini`)**: Live AI analysis using Google Gemini (`gemini-2.5-flash`) via the official `@google/genai` SDK. Requires setting `GEMINI_API_KEY` in `.env.local`.

---

## 📖 Key Documentation

- [AGENTS.md](./AGENTS.md): Essential reading for AI agents and human contributors.
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md): Domain scope and hackathon goals.
- [ARCHITECTURE.md](./ARCHITECTURE.md): System design and security boundaries.
- [INTEGRATION_CONTRACT.md](./INTEGRATION_CONTRACT.md): The inter-module data contract.
- [CONTRIBUTING.md](./CONTRIBUTING.md): Git branching and coding standards.
