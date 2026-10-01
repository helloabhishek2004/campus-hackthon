# ADR-002: Supabase as Shared Persistence & Auth Infrastructure

## Context

Smart Campus requires authentication, relational persistence, role-based authorization, and real-time updates without deploying custom database servers.

## Decision

Use Supabase (PostgreSQL + Supabase Auth + RLS) as the central backend infrastructure.

- Module 1 manages canonical tables (`profiles`, `posts`, `complaints`).
- Module 2 persists intelligence results in `complaint_ai_analysis` referencing `complaints.id`.
- Module developers do not create disconnected databases.

## Consequences

- Single backend deployment for both local and cloud environments.
- Enforced data ownership and centralized Row Level Security.
