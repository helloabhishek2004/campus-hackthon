# PROJECT_CONTEXT.md — Smart Campus Specification & Memory

## 1. Project Objective & Hackathon Context

Smart Campus is an intelligent, integrated campus information and complaint resolution ecosystem designed to replace fragmented noticeboards, manual complaint registers, and uncoordinated department responses.

The system is developed during a hackathon by multiple developers working concurrently on distinct modules:

- **Module 1**: Campus Information & Communication System (Portal, Feed, Complaint UI, Dashboards, Auth).
- **Module 2**: Complaint Intelligence Processing (AI grievance classification, severity scoring, location/entity extraction, automated routing, duplicate clustering).
- **Shared Infrastructure**: Type-safe shared contracts, reusable UI primitives, and unified PostgreSQL backend with Supabase.

---

## 2. The Core Problem Solved

In traditional university campuses:

1. Grievance submissions are vague, lack critical context (location, equipment serials), and are submitted to the wrong department.
2. Similar or identical complaints (e.g., library Wi-Fi outage, classroom projector malfunction) are repeatedly submitted by multiple students, creating redundant noise for administrators.
3. Critical hazards (electrical sparks, water leakage, lab equipment failures) are buried in standard queues without automated severity triaging.
4. Campus notices are scattered across chat groups and physical notice boards without role-targeted delivery.

Smart Campus solves this through **automated complaint intelligence** coupled with a **real-time campus communication portal**.

---

## 3. Module Scope & Responsibilities

### Module 1: Campus Information & Communication System

- **Owner**: Frontend / Full-Stack Developer (`apps/web`).
- **Scope**:
  - Student and staff authentication via Supabase Auth.
  - Role-based views: Student, Faculty, Department Head, Maintenance Officer, Administrator.
  - Campus announcements and notices feed.
  - Complaint submission workflow and tracking timeline.
  - Administrative triaging dashboard.
  - Canonical persistence of complaints, users, and audit logs.

### Module 2: Complaint Intelligence Processing

- **Owner**: AI / Backend Developer (`modules/complaint-intelligence`).
- **Scope**:
  - Processing complaint text and attachments.
  - Categorization into academic, infrastructure, hostel, sanitation, security, IT services, etc.
  - Severity assessment (`low`, `medium`, `high`, `critical`) with quantitative urgency score (0–10).
  - Location and entity extraction (building, room, floor, equipment).
  - Department and role routing recommendations with confidence scores.
  - Real-time similarity detection against existing active complaints to detect duplicates and cluster shared grievances.
  - Support for deterministic offline mock mode and Google Gemini mode (`gemini-2.5-flash`).

---

## 4. Technology Stack

- **Monorepo Management**: `pnpm` workspaces.
- **Frontend App**: Next.js 15+ (App Router), React 19, TypeScript.
- **Styling & UI**: Tailwind CSS, shadcn/ui component patterns, Lucide icons.
- **Database & Auth**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth.
- **AI Processing**: Google Gemini API via official `@google/genai` SDK, running strictly server-side.
- **Schema & Validation**: Zod runtime validation across contracts and AI outputs.
- **Testing**: Vitest for unit & integration testing.

---

## 5. Architectural Philosophy

> **"Build modules independently, but make the contracts shared."**

1. **Decoupled Development**: Developers can build and test their modules without being blocked by unfinished dependencies.
2. **Strict Contracts**: All inter-module communication is typed and validated at runtime using `@smart-campus/contracts`.
3. **Deterministic Mocking**: Module 1 can develop against Module 2's API using the mock provider without needing external API keys or cloud services.
4. **Data Ownership**: Module 1 owns canonical complaint data; Module 2 produces structured intelligence stored alongside it.
