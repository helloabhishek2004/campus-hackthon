# Institutional Identity Database, Roles & Mock Data — Master Foundation Status

## 1. Overview

The master branch foundation for institutional identity, biodata, and simulated OTP login has been established for Smart Campus. In accordance with the system specification:

- Users do **not** self-register manual profiles.
- Canonical biodata is pre-maintained in the institutional database.
- Strict phone number protection guarantees sensitive contact digits are never exposed to unauthenticated clients.
- Authentication utilizes simulated OTP verification (`OTP_PROVIDER=mock`, test code `123456`) before establishing application sessions (`public.profiles`).
- Users can hold multiple institutional responsibility tags simultaneously (`CAS_COORDINATOR`, `DEPARTMENT_COORDINATOR`, `COURSE_COORDINATOR`, `CLASS_COORDINATOR`, `HOD`).

---

## 2. Deliverables Summary

### Database Schema & Security (`supabase/migrations/003_institutional_identity.sql`)

- **`departments`**: Normalized academic and administrative units (`CSE`, `ECE`, `MECH`, `CIVIL`, `IT`, `MGMT`, `ADMIN`).
- **`programs`**: Degrees offered (`BTECH_CSE`, `MTECH_CSE`, `BTECH_ECE`, etc.).
- **`institutional_users`**: Master student/faculty records (`institutional_id`, `full_name`, sensitive `phone`, `email`, `primary_role`, `linked_profile_id`).
- **`student_biodata`**: Academic metrics (`admission_year`, `graduation_year`, `academic_year`, `current_semester`, `section`).
- **`faculty_biodata`**: Professional metrics (`designation`, `department_id`, `joining_year`).
- **`institutional_user_tags`**: Many-to-many responsibility mappings with unique constraint on `(institutional_user_id, tag)` and optional `scope`.
- **`institutional_otp_sessions`**: Time-limited challenge verification tracking.
- **Secure Phone Masking Function (`mask_phone`)**: Database function masking all but the last 4 digits (e.g., `+91 ******0001`).
- **Safe RPC Lookup Procedure (`lookup_institutional_identity`)**: `SECURITY DEFINER` function allowing anonymous/authenticated lookup of public institutional profiles without exposing raw phone numbers.
- **Row Level Security**: Direct read on `institutional_users` raw phone numbers is strictly prohibited for standard/anon users; users can only inspect their own linked records.

### Deterministic Seed Data (`supabase/seed/003_institutional_seed.sql`)

- Exactly **50 deterministic records** loaded across departments and programs:
  - **35 Students**: `STU2026001` - `STU2026035` across semesters 2, 4, 6, 8, sections A & B.
  - **10 Regular Faculty**: `FAC1001` - `FAC1010` (Assistant, Associate, Professor).
  - **3 Department Heads (HODs)**: `FAC1011` (HOD CSE), `FAC1012` (HOD ECE), `FAC1013` (HOD MECH).
  - **2 Administrators**: `ADM9001` (Registrar), `ADM9002` (IT Directorate).
- Realistic multi-tag assignments:
  - `HOD` tags on senior faculty with `DEPARTMENT_COORDINATOR` dual responsibilities.
  - `CLASS_COORDINATOR` and `COURSE_COORDINATOR` tags on active teaching faculty.
  - `CAS_COORDINATOR` tags on grievance committee faculty and student council leaders.

### Shared Contracts (`packages/contracts/src/identity.ts`)

- `InstitutionalRoleSchema`: `"student" | "faculty" | "staff" | "admin"`
- `InstitutionalTagSchema`: `"CAS_COORDINATOR" | "DEPARTMENT_COORDINATOR" | "COURSE_COORDINATOR" | "CLASS_COORDINATOR" | "HOD"`
- `InstitutionalLookupRequestSchema`: Enforces regex `^[A-Za-z0-9_-]+$`, min 3, max 30.
- `InstitutionalLookupResponseSchema`: Strictly validated safe profile payload.
- `RequestOtpRequestSchema` & `RequestOtpResponseSchema`: Challenge dispatch contracts.
- `VerifyOtpRequestSchema` & `VerifyOtpResponseSchema`: 6-digit numeric OTP verification.

### Application Session Integration Update (2026-10-10)

- Confirmed the OTP route and server identity resolver use the same signed
  `campusgram_mock_session` application-session mechanism for the hackathon flow.
- Configured Supabase does not imply a Supabase Auth JWT for dummy OTP; the
  intended configured hackathon mode is therefore `AUTH_MODE=mock`, where the
  resolver validates the signed application cookie and canonical linked profile.
  Non-mock mode continues to require a real linked Supabase Auth session.
- Session signatures use the server-only `AUTH_SESSION_SECRET` when configured,
  with the existing service-role key as a server-only fallback. The token and
  cookie share a 24-hour expiration policy; malformed, tampered, future-dated,
  and expired sessions are rejected.
- Complaint ownership and Lost & Found authorization remain server-derived from
  the shared resolver. Client identity headers and request-body ownership fields
  are not authorization inputs.
- Regression coverage: `apps/web/tests/auth-hardening.test.ts` and
  `apps/web/tests/auth.test.ts` exercise the
  configured-mode resolver with fictional identities and mocked Supabase
  responses. No live Supabase credentials or deployment state were inspected.

### Server Services & API Endpoints (`apps/web`)

- **Phone Masking Utility (`apps/web/lib/auth/masking.ts`)**: Pure utility formatting domestic and E.164 phone strings to `+91 ******3210` or `******3210`.
- **OTP Challenge Service (`apps/web/lib/auth/otp.ts`)**: Manages in-memory and database challenges, 5-minute expirations, attempt tracking (5 max), and mock mode bypass (`123456`).
- **Identity Service (`apps/web/lib/auth/identity-service.ts`)**: Integrates Supabase RPC lookups with fallback to `MOCK_INSTITUTIONAL_DIRECTORY` for zero-configuration development.
- **API Routes**:
  - `POST /api/auth/lookup`: Returns safe institutional profile with masked phone.
  - `POST /api/auth/otp/send`: Dispatches simulated OTP.
  - `POST /api/auth/otp/verify`: Validates OTP and returns session link.

---

## 3. Verification & Test Results

```text
pnpm test
✓ packages/contracts test:  13 passed (13)
✓ modules/lost-and-found test:  17 passed (17)
✓ modules/complaint-intelligence test:  7 passed (7)
✓ apps/web test:  15 passed (15)
Total: 52 tests passing across monorepo

pnpm typecheck
✓ All 9 workspace projects typecheck with 0 errors

pnpm lint
✓ All workspace projects pass linting with 0 errors / warnings

pnpm build
✓ Next.js compiled 16 static pages and 15 server API routes
```
