# CampusGram Complaint System Status

## Branch

`feature/complaint`

---

## Current State

The Complaint System has been implemented and refined with full UI, contract, and database support:

* **Complaint Submission:** Authenticated or simulated users can submit grievances containing complaint text (minimum 5 characters) and an optional image attachment.
* **Optional Image Attachment:** Users can select an image, preview the thumbnail, remove the image before submission, and view the attached image in the feed after submission. Image attachment URLs support both absolute URLs and root-relative upload paths (`/uploads/complaints/...`).
* **High-Contrast Readability:** Complaint text and metadata are styled with high-contrast text colors (`text-slate-900 dark:text-slate-100 font-medium leading-relaxed break-words whitespace-pre-wrap`) ensuring clarity on both light and dark card backgrounds, with proper multi-line rendering and horizontal word wrapping.
* **Complaint Listing & Distinct Views:**
  * **Emergency View (≥ 5 reports):** Grouped by `cluster_id` into **one** emergency cluster summary card per unique cluster. Each summary card shows an emergency badge, category, representative complaint text, total similar report count, latest timestamp, optional thumbnail, and a "View reports" trigger.
  * **Emergency Cluster Detail Modal:** Clicking "View reports" on an emergency cluster card opens a modal displaying all individual complaints in that cluster with full text, timestamps, category badges, and image attachments.
  * **Normal View:** Normal priority complaints remain individually listed with high-contrast styling and report counts.
  * **All Grievances View:** Displays all complaints with responsive cards and individual cluster inspect triggers.
* **Distinct Empty States:**
  * **All Tab:** *"No complaints have been reported yet."*
  * **Normal Tab:** *"No normal complaints."*
  * **Emergency Tab:** *"No active emergency complaints."*
* **Text-Only Similarity:** Lexical similarity is computed strictly from complaint text upon submission.
* **Cluster Assignment:** If the highest similarity score against existing complaints meets or exceeds the threshold (`0.35`), the complaint joins that existing cluster; otherwise, a new cluster ID is generated.
* **5-Complaint Emergency Threshold:** Clusters with fewer than 5 complaints are classified as Normal. When a cluster reaches 5 or more complaints, both the new complaint and all existing complaints in that cluster transition to Emergency status.

---

## Architecture

| File / Component | Responsibility |
| :--- | :--- |
| [`packages/contracts/src/complaint.ts`](file:///c:/Users/arath/campus-hackthon/packages/contracts/src/complaint.ts) | Canonical Zod schemas and TypeScript types (`ComplaintRecordSchema`, `CreateComplaintRequestSchema`, `CreateComplaintResponseSchema`, `ComplaintListQuerySchema`, `ComplaintListResponseSchema`, and constants `COMPLAINT_EMERGENCY_THRESHOLD = 5`, `DEFAULT_COMPLAINT_SIMILARITY_THRESHOLD = 0.35`). |
| [`modules/complaint-intelligence`](file:///c:/Users/arath/campus-hackthon/modules/complaint-intelligence) | Provides shared text processing utilities: `computeJaccardSimilarity`, `tokenize`, `findSimilarCandidates`, and `searchCandidates`. |
| [`apps/web/lib/complaints/similarity-service.ts`](file:///c:/Users/arath/campus-hackthon/apps/web/lib/complaints/similarity-service.ts) | Domain similarity service wrapping `computeJaccardSimilarity`. Compares complaint text against candidate complaints and resolves target cluster IDs. |
| [`apps/web/lib/complaints/complaint-repository.ts`](file:///c:/Users/arath/campus-hackthon/apps/web/lib/complaints/complaint-repository.ts) | Data access layer with dual-mode support (Supabase PostgreSQL when configured, local in-memory fallback for offline/mock development), cluster counting, and emergency cascade updates. |
| [`apps/web/app/api/complaints/route.ts`](file:///c:/Users/arath/campus-hackthon/apps/web/app/api/complaints/route.ts) | RESTful API route handler implementing `POST /api/complaints` (creation, clustering, and emergency determination) and `GET /api/complaints` (filtering by `view=all\|normal\|emergency`). |
| [`apps/web/app/api/complaints/upload/route.ts`](file:///c:/Users/arath/campus-hackthon/apps/web/app/api/complaints/upload/route.ts) | Validated image upload endpoint storing images in `public/uploads/complaints/` with MIME type and size checks. |
| [`apps/web/app/api/complaints/[id]/route.ts`](file:///c:/Users/arath/campus-hackthon/apps/web/app/api/complaints/[id]/route.ts) | Endpoint returning a single complaint and its cluster peer complaints. |
| [`apps/web/app/complaints/page.tsx`](file:///c:/Users/arath/campus-hackthon/apps/web/app/complaints/page.tsx) | Complete CampusGram Complaint UI with submission form, image preview, and tabbed feed ("All", "Normal", "Emergency"). |
| [`supabase/migrations/004_complaint_clusters.sql`](file:///c:/Users/arath/campus-hackthon/supabase/migrations/004_complaint_clusters.sql) | Database migration adding `cluster_id` (TEXT) and `is_emergency` (BOOLEAN) to `public.complaints`, with B-Tree indexes and a cluster summary view (`complaint_cluster_summary`). |
| [`supabase/migrations/005_complaint_rls_and_cascade.sql`](file:///c:/Users/arath/campus-hackthon/supabase/migrations/005_complaint_rls_and_cascade.sql) | Database migration adding campus-wide authenticated `SELECT` policy and a secure `SECURITY DEFINER` function (`cascade_complaint_emergency`) for the 5-complaint escalation. |

---

## Similarity

* **Text-Only Input:** Only complaint text enters the similarity pipeline. Images, file attachments, and metadata are strictly excluded.
* **Lexical Similarity (NOT Semantic Embeddings):** The current algorithm is **lexical Jaccard similarity** on token sets ($|A \cap B| / |A \cup B|$), **NOT** embedding-based semantic similarity or dense vector search.
* **Reused Algorithm:** Reuses `computeJaccardSimilarity()` and `tokenize()` from `modules/complaint-intelligence`.
* **Configurable Threshold:** Defaults to `0.35` (`DEFAULT_COMPLAINT_SIMILARITY_THRESHOLD`), configurable via `process.env.COMPLAINT_SIMILARITY_THRESHOLD`.
* **Zero Image ML:** No image embeddings, no OCR, no image classification, and no computer vision models exist in the Complaint module.
* **Isolation from Lost & Found AI:** Does not touch `services/lost-found-ai`, YOLO, CLIP, MiniLM, or FastAPI services.

---

## Emergency Rule

$$\text{cluster size} < 5 \longrightarrow \text{Normal}$$
$$\text{cluster size} \ge 5 \longrightarrow \text{Emergency}$$

* **Cluster-Based, Not Individual:** A complaint is not emergency based on its own wording; emergency status is strictly determined by the count of complaints belonging to the same similarity cluster.
* **Group Cascade:** When a cluster reaches 5 complaints, all existing complaints in that cluster are updated to reflect the emergency state. In the UI, every complaint in that cluster displays the Emergency badge and appears under the Emergency tab.

---

## Image Handling

* **Current Storage:** Images are uploaded through `POST /api/complaints/upload` and saved directly to the local server filesystem:
  `public/uploads/complaints/[uuid].[ext]`
* **Storage Status:** **`LOCAL / DEMO STORAGE`**
* **Deployment Limitation:** This local filesystem storage is **NOT production-ready Supabase Storage**. In serverless deployments (e.g. Vercel, AWS Lambda) or ephemeral container environments, local filesystem writes fail or are erased on redeployment/restart. Migration to a Supabase Storage bucket (`complaint-attachments`) is required for production.
* **Role of Images:** Strictly for storing, retrieving, and displaying in the UI.

---

## Database & RLS Security Architecture

The Complaint System security and access model is governed by `001_initial_schema.sql`, `004_complaint_clusters.sql`, and `005_complaint_rls_and_cascade.sql`:

* **Campus-Wide Authenticated Read Access:** `005_complaint_rls_and_cascade.sql` replaces the previous self-only policy with:
  ```sql
  CREATE POLICY "Campus complaints are viewable by authenticated users"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (true);
  ```
  This allows all authenticated students and faculty to view active campus complaints and monitor emergency clusters.
* **Narrow Database-Level Emergency Cascade:** To prevent students from being granted general `UPDATE` permissions on complaints, a dedicated Postgres function is implemented:
  ```sql
  CREATE OR REPLACE FUNCTION public.cascade_complaint_emergency(target_cluster_id TEXT)
  RETURNS INT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$ ... $$;
  ```
  * **Input Validation:** Rejects null or empty string `target_cluster_id`.
  * **Strict Scope:** Exclusively updates `is_emergency = true` and `updated_at` on rows matching `cluster_id = target_cluster_id`. It cannot touch other columns, tables, or clusters.
  * **Search Path Lockdown:** Explicit `SET search_path = public, pg_temp` prevents search path hijacking.
  * **Execute Permissions:** Revoked from `PUBLIC`, granted only to `authenticated` and `service_role`.
* **Zero Direct UPDATE or DELETE Grants:** Authenticated users do NOT have direct `UPDATE` or `DELETE` grants or policies on `public.complaints`.

---

## Current Verification

Latest verified test and build results:

* **Tests:** 67 passed across all 8 workspace packages (`npx pnpm test`).
  * `apps/web`: 30 passed (including 15 complaint unit, integration, attachment format, and cluster grouping tests).
  * `packages/contracts`: 13 passed.
  * `modules/complaint-intelligence`: 7 passed.
  * `modules/lost-and-found`: 17 passed.
* **Typecheck:** Passed with 0 errors across all 9 workspaces (`npx pnpm typecheck`).
* **Lint:** Passed with 0 errors (`npx pnpm lint`).
* **Production Build:** Next.js production build succeeded with all 19 static and dynamic routes compiled (`npx pnpm --filter @smart-campus/web build`).

---

## Known Issues

### Medium Severity
1. **Local Filesystem Image Storage Not Production-Safe:** Images written to `public/uploads/complaints/` will not survive server restarts, container redeployments, or serverless execution environments.
2. **Cluster Assignment Concurrency Race Condition:** Simultaneous complaint submissions can concurrently read the database, find 0 matches, and generate separate duplicate clusters for identical issues.
3. **Client-Declared MIME Validation:** Image upload checks `blob.type` (HTTP `Content-Type`), which is client-controlled and not verified by magic file header bytes.

### Low Severity
4. **Single-Character Location Stripping:** Tokenizer filter `filter((w) => w.length > 2)` strips single-letter block identifiers ("A", "B", "C"), causing "Hostel A" and "Hostel B" water issues to have identical token sets and merge into the same cluster.

---

## Required Fixes (Remaining)

1. **Move Production Image Storage to Supabase Storage:** Connect `POST /api/complaints/upload` to a Supabase Storage bucket (`complaints`) using public storage URLs when Supabase is configured.
2. **Harden Image Validation:** Use a static MIME-to-extension map and check magic numbers rather than string-splitting `blob.type`.
3. **Decide Location Tokenization Strategy:** Preserve standalone single uppercase characters (e.g. Block A/B/C) in tokenization if location differentiation is required.
4. **Add Missing Tests:** Add tests for `GET /api/complaints/[id]`, concurrent submissions, multiple coexisting clusters, and upload validation edge cases.
5. **Evaluate Concurrency Handling:** Address concurrent cluster creation via database-level locking or upsert transactions.

---

## Important Product Decisions

* **Images are display/storage only:** Under no circumstances should images undergo classification, embedding, or feature extraction.
* **Images must never enter similarity detection:** The similarity pipeline takes only `complaint.text`.
* **Similarity is text-only:** Currently using lexical Jaccard similarity.
* **Emergency status is cluster-based:** An individual complaint cannot be marked emergency on its own unless its cluster count reaches 5.
* **Emergency threshold is strictly 5 complaints:** $< 5$ is Normal, $\ge 5$ is Emergency.
* **No redundant group count columns:** Do not add a persistent `group_count` column to the table; derive count from `cluster_id`.

---

## Scope

* **Module Ownership:** Complaint System module ONLY.
* **Strict Non-Interference:** Do NOT modify:
  * Lost & Found (`modules/lost-and-found`, `services/lost-found-ai`, `workers/lost-found-worker`)
  * Institutional identity / Auth (`apps/web/lib/auth`, `003_institutional_identity.sql`)
  * Onboarding
  * Unrelated feeds / dashboards
  * External AI services

---

## Future Agent Instructions

Any future developer or AI agent working on this module MUST:

1. **Read this `STATUS.md` first** before inspecting or modifying code.
2. **Inspect the actual implementation** rather than relying on assumptions.
3. **Preserve the text-only similarity boundary:** Never pass images to similarity functions.
4. **Never introduce image ML:** No OCR, CLIP, YOLO, or CV models in this module.
5. **Never modify unrelated modules:** Respect the monorepo boundaries in `AGENTS.md`.
6. **Update `STATUS.md`** after any meaningful architectural changes.
7. **Record unresolved issues honestly:** Never hide known limitations.
8. **Never claim production readiness** unless storage, RLS, and deployment behavior have been verified in a live Supabase environment.
