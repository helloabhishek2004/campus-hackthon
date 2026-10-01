# Module 1: Campus Information & Communication System

## Developer Ownership

- Primary workspace: `apps/web/`
- Documentation: `docs/modules/MODULE_1.md`

## Scope

1. **User Authentication & Profiles**:
   - Integrated with Supabase Auth.
   - Roles: Student, Faculty, Department Head, Maintenance Officer, Admin.
2. **Campus Communication Feed**:
   - Posts, circulars, department events, and emergency announcements.
   - Filtering by department, scope, and urgency.
3. **Complaint Workflow**:
   - Grievance submission form (text + optional image attachments).
   - Real-time status tracker (`submitted` -> `under_review` -> `in_progress` -> `resolved`).
   - Integration with Module 2 via `@smart-campus/contracts` and `/api/complaints/analyze`.
4. **Officer Triage Dashboard**:
   - View assigned issues, filter by AI severity score and department.

## Code Conventions

- Pages live in `apps/web/app/`.
- UI primitives should be pulled from `@smart-campus/ui` or added there if reusable.
- Never directly modify `modules/complaint-intelligence` internals.
