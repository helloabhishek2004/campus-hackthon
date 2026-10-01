# Smart Campus --- Module 1 Implementation Specification

## Purpose

This document is the master build specification for Antigravity. It
defines the product problem, architecture, technology stack, database
model, authorization model, user flows, AI flow, MVP boundaries,
implementation order, and acceptance criteria.

## 1. Product

The Smart Campus challenge requires a genuine campus problem, analysis
of existing limitations, a practical technology-driven solution, a
functional MVP, and a clear path to campus-scale implementation. The
proposed solution addresses fragmented campus communication: important
information is scattered across class, department, official, club,
event, project, and informal WhatsApp groups.

This is **not a WhatsApp clone**.

It is a **structured campus information network**.

> WhatsApp gives a campus conversations. We give it organized
> information.

Core principle:

> **Right information. Right person. Right time.**

The system must make the campus information flow searchable, targeted,
structured, attributable, and verifiable.

## 2. Core Problem

Students often belong to many communication groups. Important
announcements can be:

-   buried under normal conversation
-   duplicated across groups
-   sent to the wrong audience
-   difficult to find later
-   unclear in terms of source or authority
-   missed while a student is offline

The platform solves this by attaching structure to every information
item:

-   author
-   author role
-   authority scope
-   category
-   type
-   audience
-   priority
-   verification status
-   timestamp
-   attachments
-   AI-extracted metadata
-   comments
-   reactions
-   reports

## 3. Core Technical Idea

The system must not ask only:

> Who are you?

It must ask:

> Who are you, in what context, and what are you authorized to do?

Roles are **scoped**, not global.

Example:

``` text
Abhishek
├── Student
└── Class Coordinator
    └── M.Sc CS AI — Semester 3 — Section A
```

If this user posts to S3-A, coordinator authority applies.

If the same user posts to the whole department or campus, coordinator
authority does **not** automatically apply. Outside the assigned scope,
the user behaves as a normal student unless another valid role grants
authority.

This scoped authorization model is a core differentiator and must not be
replaced by a simple global role flag.

## 4. Technology Stack

### Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Lucide icons
-   Next.js App Router

### Backend/platform

Use **Supabase** for:

-   PostgreSQL
-   Auth foundation
-   Storage
-   Row Level Security
-   Realtime where useful
-   database functions

No separate Express server, MongoDB, Redis, microservice architecture,
or Kubernetes is required for the hackathon MVP.

### AI

Use **Gemini API** for:

-   document summarization
-   classification
-   date/time extraction
-   venue extraction
-   course/exam information extraction
-   priority suggestion
-   audience suggestion
-   missing-information detection
-   structured announcement generation

Gemini is an **assistant**, not the source of truth.

The Gemini API key must never be exposed in client-side code. Call
Gemini from a server-side route, server action, or Supabase Edge
Function.

### Deployment

-   Vercel
-   Supabase
-   Gemini API

## 5. Architecture

``` text
Student / Faculty Browser
          |
          v
Next.js + React + TypeScript
          |
     +----+----+
     |         |
     v         v
 Supabase   Server AI Layer
     |         |
     |         v
     |      Gemini API
     |
     +-- PostgreSQL
     +-- Auth
     +-- Storage
     +-- RLS
     +-- Realtime
```

## 6. MVP Scope

Module 1 must establish:

1.  application shell
2.  Supabase connection
3.  database schema
4.  seed/mock institutional data
5.  demo authentication
6.  user profile
7.  scoped roles
8.  audience authorization
9.  posts/announcements
10. audience targeting
11. attachments
12. verification
13. comments
14. reactions
15. reports
16. AI extraction records
17. RLS foundation
18. Storage
19. personalized feed
20. create-post flow
21. document foundation
22. profile foundation
23. loading/error/empty states

## 7. Explicit Non-Goals

Do not spend hackathon time on:

-   real SMS OTP
-   real ERP/SIS integration
-   microservices
-   Kubernetes
-   Redis
-   separate MongoDB
-   advanced recommendation engines
-   full video AI
-   production push notification infrastructure
-   multi-campus tenancy
-   complex analytics
-   unnecessary social-network features

The goal is a stable, convincing MVP.

## 8. Database Model

### users

``` sql
users (
  id uuid primary key,
  institution_id uuid,
  student_or_faculty_id text unique not null,
  name text not null,
  phone text,
  email text,
  department_id uuid,
  programme_id uuid,
  semester int,
  batch text,
  class_id uuid,
  status text default 'active',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

### roles

``` sql
roles (
  id uuid primary key,
  name text unique not null
)
```

Seed roles:

``` text
student
faculty
course_coordinator
class_coordinator
department_coordinator
hod
director
admin
```

### role_assignments

``` sql
role_assignments (
  id uuid primary key,
  user_id uuid references users(id) on delete cascade,
  role_id uuid references roles(id),
  scope_type text not null,
  scope_id uuid,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  created_at timestamptz default now()
)
```

Possible scope types:

``` text
institution
campus
department
programme
semester
batch
class
course
```

### departments

``` sql
departments (
  id uuid primary key,
  name text not null unique
)
```

### programmes

``` sql
programmes (
  id uuid primary key,
  department_id uuid references departments(id),
  name text not null
)
```

### classes

``` sql
classes (
  id uuid primary key,
  programme_id uuid references programmes(id),
  semester int,
  batch text,
  section text,
  name text
)
```

### courses

``` sql
courses (
  id uuid primary key,
  department_id uuid references departments(id),
  code text unique not null,
  name text not null
)
```

### course_assignments

``` sql
course_assignments (
  id uuid primary key,
  course_id uuid references courses(id),
  faculty_id uuid references users(id),
  class_id uuid references classes(id),
  role text
)
```

### posts

``` sql
posts (
  id uuid primary key,
  author_id uuid references users(id) not null,
  category text not null,
  type text,
  title text not null,
  description text,
  priority text default 'normal',
  status text default 'published',
  verification_status text default 'unverified',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Categories:

``` text
academic
non_academic
```

Academic types:

``` text
exam
timetable
assignment
course_registration
class_change
academic_notice
deadline
result
```

Non-academic types:

``` text
event
workshop
internship
exchange_programme
club
sports
cultural
lost_found
free_food
opportunity
general
```

### post_audiences

``` sql
post_audiences (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  audience_type text not null,
  audience_id uuid,
  created_at timestamptz default now()
)
```

Possible audience types:

``` text
campus
department
programme
semester
batch
class
course
custom
```

A post can target multiple audiences.

### attachments

``` sql
attachments (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  uploaded_by uuid references users(id),
  file_url text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz default now()
)
```

### post_verifications

``` sql
post_verifications (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  verified_by uuid references users(id),
  status text not null,
  note text,
  created_at timestamptz default now()
)
```

### ai_extractions

``` sql
ai_extractions (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  model text,
  summary text,
  extracted_data jsonb,
  confidence numeric,
  created_at timestamptz default now()
)
```

### comments

``` sql
comments (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references users(id),
  content text not null,
  parent_id uuid references comments(id),
  created_at timestamptz default now()
)
```

### reactions

``` sql
reactions (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
)
```

### reports

``` sql
reports (
  id uuid primary key,
  post_id uuid references posts(id) on delete cascade,
  reported_by uuid references users(id),
  reason text not null,
  status text default 'pending',
  reviewed_by uuid references users(id),
  created_at timestamptz default now()
)
```

## 9. Role and Permission Rules

### Student

Can:

-   view relevant information
-   comment
-   react
-   report
-   create permitted non-academic posts

Cannot automatically:

-   publish official academic notices
-   verify posts
-   publish with coordinator authority

### Class Coordinator

Authority is limited to the assigned class.

Example:

``` text
Class Coordinator
M.Sc CS AI — S3-A
```

Can operate as coordinator for S3-A.

Outside S3-A, coordinator authority does not automatically apply.

### Department Coordinator

Authority is limited to the assigned department.

### Course Coordinator

Authority is limited to the assigned course/class context.

A course coordinator must not automatically gain authority over
unrelated classes or departments.

### HOD

Authority is scoped to the department.

### Director / Admin

May have institution-wide authority.

## 10. Central Permission Layer

Implement a centralized service such as:

``` ts
canCreatePost(userContext, postType)
canPublishToAudience(userContext, audience)
canVerifyPost(userContext, post)
canEditPost(userContext, post)
canModeratePost(userContext, post)
```

Do not place authorization logic directly inside components.

Do not trust a role supplied by the browser.

Derive identity and authority from the authenticated session and
database.

Frontend permission checks are for UX only. Backend checks and RLS are
mandatory.

## 11. Verification

Student posts begin as:

``` text
🟡 Unverified
```

Authorized coordinators/faculty can verify:

``` text
🟢 Officially Verified
```

Community engagement can be represented separately:

``` text
🔵 Community-confirmed
```

Likes/dislikes must never equal official verification.

Verification stores:

-   verifier
-   verification status
-   time
-   optional note
-   verifier context if needed

Verification scope must also be enforced.

A post verified for S3-A is not automatically verified campus-wide.

## 12. Priority

Use:

``` text
🔴 urgent
🟠 important
🔵 normal
⚪ community
```

Priority is an information property, not an authorization mechanism.

## 13. Feed

After login:

``` text
User
 ↓
Institutional profile
 ↓
Role assignments
 ↓
Department/programme/semester/batch/class/course context
 ↓
Resolve relevant audiences
 ↓
Fetch matching posts
 ↓
Show personalized feed
```

A student should not manually join every class or department feed.

Example student context:

``` text
Department: Computer Science
Programme: M.Sc Computer Science — AI
Semester: 3
Batch: 2025–2027
Class: S3-A
```

Feed can include:

``` text
Campus
Department
Programme
Semester
Batch
Class
Course
```

## 14. Home UI

Primary navigation:

``` text
Home
Documents
Create
Notifications
Profile
```

Settings should live under Profile.

Home should contain:

``` text
Good morning, Abhishek 👋
M.Sc CS AI · S3-A

Important for you

[Academic] [Non-Academic]

Feed
```

Post cards should show:

-   title
-   short description
-   category
-   priority
-   author
-   author role
-   verification
-   audience
-   timestamp
-   attachment indicator
-   comments
-   reactions

Example:

``` text
🟠 ACADEMIC · IMPORTANT

Computer Networks Internal Exam

Exam venue has been changed to Seminar Hall 2.

👤 Dr. Anil · Course Coordinator
🟢 Officially Verified
M.Sc CS AI · S3-A

💬 4   👍 18
```

## 15. Create Flow

``` text
Create
 ↓
Select type
 ↓
Enter title
 ↓
Description
 ↓
Attach document/image
 ↓
Select audience
 ↓
Priority
 ↓
AI assistance if attachment exists
 ↓
Review
 ↓
Authorization check
 ↓
Publish
```

Audience options must be dynamically restricted according to the user's
scoped authority.

## 16. Document Flow

Example:

``` text
Faculty uploads Exam_Notification.pdf
 ↓
Store original file
 ↓
Extract text
 ↓
Gemini
 ↓
Structured extraction
 ↓
Review UI
 ↓
Faculty edits if required
 ↓
Authorization
 ↓
Publish
```

Example extraction:

``` json
{
  "category": "academic",
  "type": "examination",
  "department": "Computer Science",
  "semester": 3,
  "exam_date": "2026-10-15",
  "venue": "Seminar Hall",
  "priority": "important"
}
```

AI must never publish automatically.

## 17. Gemini Output Contract

Use strict structured JSON.

Example:

``` json
{
  "summary": "...",
  "category": "academic",
  "type": "exam",
  "priority": "important",
  "suggested_audience": [],
  "extracted_fields": {
    "date": null,
    "time": null,
    "venue": null,
    "course_code": null,
    "deadline": null
  },
  "missing_information": [],
  "confidence": 0.0
}
```

Validate Gemini output before storing it.

Store AI output separately from the original document.

## 18. Authentication

Hackathon authentication can use demo OTP.

Flow:

``` text
Student ID
 ↓
Mock directory lookup
 ↓
"OTP sent to registered mobile"
 ↓
123456
 ↓
Session
 ↓
Profile
```

Production replacement:

``` text
Student ID
 ↓
Institution SIS lookup
 ↓
Registered mobile
 ↓
SMS OTP
 ↓
Authenticated session
```

The UI should make it clear that the current OTP is a prototype/demo
mechanism.

## 19. Seed Data

Create realistic mock data.

Departments:

``` text
Computer Science
Commerce
Physics
Mathematics
English
Management
```

Programmes:

``` text
M.Sc Computer Science — AI
B.Sc Computer Science
M.Com
M.Sc Physics
```

Classes:

``` text
M.Sc CS AI — S3-A
M.Sc CS AI — S3-B
B.Sc CS — S5-A
```

Users:

``` text
student
class coordinator
department coordinator
faculty
course coordinator
HOD
director/admin
```

Seed posts:

``` text
Exam venue changed
Assignment deadline
Timetable update
Course registration notice
AI workshop
Internship opportunity
Free food near auditorium
Lost ID card
Photography club event
Sports registration
```

## 20. Demo Flow

The strongest demo should show the information problem.

### Before

Simulate:

``` text
437 unread messages

"Exam postponed??"
"Guys what room?"
"Forwarded..."
"Important!!!"
"Anyone know?"
"Check group"
"Sir sent PDF"
"Which group?"
```

An important announcement is buried.

### After

Student opens the platform:

``` text
You missed 4 important updates.

🟠 Exam venue changed
🟠 Assignment deadline
🔵 AI Workshop
🟢 Verified campus opportunity
```

Optional high-value feature:

``` text
You missed X important updates
```

Use a simple `last_seen_at` field if time permits.

## 21. Comments and Community Interaction

Comments remain attached to the announcement.

Flow:

``` text
Announcement
 ↓
Question
 ↓
Answer
 ↓
Clarification
```

instead of creating another WhatsApp conversation.

Support replies with:

``` text
parent_id
```

Reactions:

``` text
like
dislike
```

Reports:

``` text
misinformation
spam
inappropriate
wrong audience
duplicate
other
```

## 22. Storage

Supabase Storage buckets:

``` text
post-attachments
avatars
```

Recommended path:

``` text
post-attachments/{post_id}/{uuid}-{filename}
```

Store file metadata in PostgreSQL.

MVP formats:

``` text
PDF
DOC/DOCX
XLS/XLSX
PNG/JPG/JPEG
TXT
```

Video can remain future scope.

## 23. RLS

RLS is mandatory.

Principles:

-   users can read permitted profile information
-   users can read posts whose audience includes them
-   users can create posts only when authorized
-   users can edit their own permitted posts
-   moderators can act only within scope
-   only authorized users can create verification records
-   users can comment on posts they can access
-   users can manage their own reactions
-   users can submit reports
-   only authorized moderators can review reports

Never rely only on frontend filtering.

## 24. Project Structure

Suggested:

``` text
src/
  app/
  components/
  features/
    auth/
    feed/
    posts/
    documents/
    comments/
    verification/
    profile/
  lib/
    supabase/
    auth/
    permissions/
    ai/
    validation/
  types/
  hooks/
```

Keep business logic out of UI components.

## 25. Validation

Use Zod or equivalent schema validation.

Validate:

-   post input
-   audience input
-   priority
-   comments
-   reactions
-   verification
-   file metadata
-   AI output

Never trust client-provided user IDs or roles for authorization.

## 26. Security

Mandatory:

-   Gemini API key server-side only
-   no Supabase service-role key in browser
-   backend authorization
-   RLS
-   file type validation
-   file size limits
-   safe user-content rendering
-   audience authorization
-   scoped verification
-   no role impersonation
-   original document preservation

## 27. Implementation Order

Implement in dependency order:

### Phase 1 --- Foundation

-   inspect existing repository
-   initialize/repair Next.js setup if needed
-   install required dependencies
-   configure Tailwind/shadcn
-   configure Supabase
-   configure environment variables
-   establish app layout

### Phase 2 --- Database

Create all tables, relationships, constraints and indexes.

### Phase 3 --- Seed Data

Seed organizational structure, users, roles, assignments and demo posts.

### Phase 4 --- Authentication

Implement Student ID + demo OTP + session.

### Phase 5 --- User Context

Implement:

``` ts
getCurrentUserContext()
```

Return:

-   profile
-   roles
-   scopes
-   department
-   programme
-   semester
-   batch
-   class
-   courses

### Phase 6 --- Authorization

Implement centralized permission functions and RLS.

### Phase 7 --- Feed

Implement:

-   Home
-   Academic
-   Non-Academic
-   post details

### Phase 8 --- Create

Implement:

-   create post
-   audience selection
-   priority
-   attachments
-   review
-   publish

### Phase 9 --- Documents

Implement upload, preview/download and document listing.

### Phase 10 --- Gemini

Implement server-side AI extraction and editable review.

### Phase 11 --- Interaction

Implement comments, replies, likes, dislikes and reports.

### Phase 12 --- Verification

Implement scoped verification and verification history.

### Phase 13 --- Polish

Improve loading states, errors, empty states, mobile layout and demo
quality.

## 28. Antigravity Rules

Before changing code:

1.  Inspect the repository.
2.  Identify framework and package manager.
3.  Reuse existing working infrastructure.
4.  Check current Supabase configuration.
5.  Check existing environment variables without exposing secrets.
6.  Build a short task checklist from this specification.

While implementing:

-   keep the app runnable after every major phase
-   use TypeScript strictly
-   avoid unnecessary dependencies
-   keep authorization centralized
-   preserve original files
-   keep AI behind a server-side boundary
-   use Supabase-native functionality
-   create realistic seed data
-   do not invent unnecessary infrastructure

After every major phase:

``` text
typecheck
lint
build
```

Fix errors before continuing.

## 29. Do Not Do These Things

Do not build:

-   a WhatsApp clone
-   a global coordinator boolean
-   frontend-only authorization
-   arbitrary audience targeting
-   automatic AI publication
-   AI verification based on confidence alone
-   unnecessary microservices
-   advanced analytics before core flows
-   real OTP infrastructure for the hackathon
-   complex video AI before the core MVP works

## 30. Definition of Done

The first implementation is complete when a judge can watch this without
developer intervention:

``` text
1. Student ID login
2. Demo OTP
3. Profile automatically identified
4. Personalized feed
5. Academic/non-academic filtering
6. Announcement details
7. Student comment/reaction
8. Faculty/coordinator login
9. Create announcement
10. Upload document
11. Gemini extraction
12. Review extracted information
13. Audience authorization
14. Student receives announcement
15. Student creates non-academic post
16. Post starts unverified
17. Authorized coordinator verifies it
18. Verification status changes
19. Unauthorized scope attempt is rejected
```

## 31. Acceptance Tests

### Authentication

-   valid ID accepted
-   invalid ID rejected
-   demo OTP accepted
-   wrong OTP rejected
-   session persists
-   profile loads

### Authorization

-   student cannot create restricted academic notice
-   student can create allowed non-academic post
-   class coordinator works within assigned class
-   coordinator authority does not leak outside scope
-   HOD works within department
-   admin/director can work campus-wide if configured

### Feed

-   relevant campus posts appear
-   department posts appear
-   class posts appear
-   irrelevant class posts are excluded
-   academic filter works
-   non-academic filter works

### Posts

-   create
-   open
-   edit own permitted post
-   attachment
-   priority
-   author role
-   audience
-   verification state

### AI

-   document upload works
-   Gemini extraction works
-   structured output is validated
-   fields are editable
-   original document remains available
-   AI failure does not destroy upload

### Verification

-   student post starts unverified
-   authorized coordinator can verify
-   unauthorized user cannot verify
-   verification metadata is stored

### Interaction

-   comment
-   reply
-   like
-   dislike
-   report

## 32. Future Modules

### Module 2 --- AI Information Intelligence

-   advanced Gemini extraction
-   summaries
-   duplicate detection
-   missing-information detection
-   better classification

### Module 3 --- Smart Feed

-   missed updates
-   saved posts
-   search
-   priority-aware feed

### Module 4 --- Notifications

-   push
-   email
-   SMS
-   digest

### Module 5 --- Moderation

-   moderation dashboard
-   audit trails
-   abuse detection

### Module 6 --- Campus Intelligence

-   analytics
-   information-flow metrics
-   frequently missed information
-   department insights

### Module 7 --- Institutional Integration

-   SIS/ERP
-   timetable
-   examination systems
-   official directory
-   institutional authentication

## 33. Product Differentiator

The system is:

``` text
Identity-aware
+
scope-aware
+
audience-aware
+
verification-aware
+
AI-assisted
campus information
```

It understands:

``` text
WHO
+
IN WHAT ROLE
+
WITH WHAT AUTHORITY
+
SPEAKING TO WHOM
+
ABOUT WHAT
```

That is the core technical idea.

## 34. Final Architecture

``` text
                 INSTITUTIONAL IDENTITY
                         |
                         v
                  USER PROFILE
                         |
                         v
                 ROLE + SCOPE
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
          PUBLISH     VERIFY      CONSUME
             |           |           |
             +-----------+-----------+
                         |
                         v
                       POSTS
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
      DOCUMENTS       GEMINI        AUDIENCE
          |              |              |
          v              v              v
       ORIGINAL      STRUCTURED      TARGETED
        SOURCE        METADATA      DISTRIBUTION
                         |
                         v
                    STUDENT FEED
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
         COMMENTS    REACTIONS     REPORTS
```

## 35. Guiding Principle

The application should feel like the campus finally has a proper
**information system**, rather than another place where students have to
chase messages.

> **Observe. Identify. Innovate. Solve.**
