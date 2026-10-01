-- ==============================================================================
-- Smart Campus: 004_document_management.sql
-- Document types, documents metadata, versioning, audit events & RLS policies
-- ==============================================================================

-- 1. Document Types Catalog
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'non-academic')),
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'file-text',
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['student', 'faculty', 'staff', 'admin'],
  is_uploadable BOOLEAN NOT NULL DEFAULT true,
  is_generated BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Documents (Canonical Metadata Store)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_institutional_user_id UUID REFERENCES public.institutional_users(id) ON DELETE SET NULL,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'non-academic')),
  description TEXT NOT NULL DEFAULT '',
  document_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Available', 'Verified', 'Approved', 'Ready', 'Pending Verification', 'Rejected')),
  status_variant TEXT NOT NULL DEFAULT 'default' CHECK (status_variant IN ('success', 'default', 'secondary', 'warning', 'destructive')),
  storage_path TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size BIGINT,
  issuer TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  reference_code TEXT NOT NULL,
  issued_date TEXT NOT NULL,
  valid_through TEXT,
  remarks TEXT,
  current_version INT NOT NULL DEFAULT 1,
  verified_at TIMESTAMPTZ,
  verified_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Document Versions (Historical Revisions)
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(document_id, version_number)
);

-- 4. Document Audit Events (Tamper-Resistant Log)
CREATE TABLE IF NOT EXISTS public.document_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'uploaded', 'version_added', 'viewed', 'downloaded', 'verified', 'rejected', 'metadata_updated')),
  event_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents (owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_inst_user ON public.documents (owner_institutional_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents (category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_number ON public.documents (document_number);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents (document_type_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON public.document_versions (document_id);
CREATE INDEX IF NOT EXISTS idx_document_events_doc ON public.document_events (document_id);
CREATE INDEX IF NOT EXISTS idx_document_events_actor ON public.document_events (actor_profile_id);

-- 6. Row Level Security (RLS)
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_events ENABLE ROW LEVEL SECURITY;

-- Document Types Policies (Readable by authenticated users and anon)
CREATE POLICY "document_types_readable"
  ON public.document_types
  FOR SELECT
  USING (is_active = true);

-- Documents Policies
-- Users can see their own documents, or authority roles (admin, faculty, department_head) can see student documents
CREATE POLICY "documents_owner_select"
  ON public.documents
  FOR SELECT
  USING (
    owner_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'faculty', 'department_head')
    )
  );

-- Users can insert their own documents
CREATE POLICY "documents_owner_insert"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    owner_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Owners can update their own documents, or authorized staff can update verification status
CREATE POLICY "documents_owner_update"
  ON public.documents
  FOR UPDATE
  USING (
    owner_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'faculty', 'department_head')
    )
  );

-- Owners or Admins can delete documents
CREATE POLICY "documents_owner_delete"
  ON public.documents
  FOR DELETE
  USING (
    owner_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Document Versions Policies
CREATE POLICY "document_versions_select"
  ON public.document_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND (
        d.owner_profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'faculty', 'department_head')
        )
      )
    )
  );

CREATE POLICY "document_versions_insert"
  ON public.document_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND (d.owner_profile_id = auth.uid() OR auth.uid() = uploaded_by)
    )
  );

-- Document Events Policies
CREATE POLICY "document_events_select"
  ON public.document_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND (
        d.owner_profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'faculty', 'department_head')
        )
      )
    )
  );

CREATE POLICY "document_events_insert"
  ON public.document_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 7. Seed Document Types
INSERT INTO public.document_types (id, code, name, category, description, icon_name, allowed_roles, is_uploadable, is_generated) VALUES
  ('66666666-6666-6666-6666-666666660001', 'DIGITAL_ID', 'Institutional Digital ID', 'academic', 'Official university student/faculty identity card with QR verification', 'id-card', ARRAY['student', 'faculty', 'staff', 'admin'], false, true),
  ('66666666-6666-6666-6666-666666660002', 'BONAFIDE_CERT', 'Bonafide Certificate', 'academic', 'Proof of regular enrollment for visa, loan, and exam applications', 'award', ARRAY['student'], true, true),
  ('66666666-6666-6666-6666-666666660003', 'GRADE_CARD', 'Semester Grade Card', 'academic', 'Authenticated grade sheet and credit audit statement', 'file-text', ARRAY['student'], false, true),
  ('66666666-6666-6666-6666-666666660004', 'ATTENDANCE_RECORD', 'Attendance Record', 'academic', 'Certified biometric and classroom attendance summary', 'calendar-check', ARRAY['student'], false, true),
  ('66666666-6666-6666-6666-666666660005', 'COURSE_REG', 'Course Registration Sheet', 'academic', 'Approved courses, electives, and lab section allotments', 'book-open', ARRAY['student'], true, true),
  ('66666666-6666-6666-6666-666666660006', 'ACADEMIC_TRANSCRIPT', 'Academic Transcript', 'academic', 'Consolidated academic statement under NAD guidelines', 'award', ARRAY['student'], false, true),
  ('66666666-6666-6666-6666-666666660007', 'FEE_RECEIPT', 'Tuition & Fee Receipt', 'academic', 'Certified university accounts clearance receipt', 'file-text', ARRAY['student'], false, true),
  ('66666666-6666-6666-6666-666666660008', 'HALL_TICKET', 'Examination Hall Ticket', 'academic', 'Authorized examination entry pass with seating details', 'calendar-check', ARRAY['student'], false, true),
  ('66666666-6666-6666-6666-666666660009', 'EVENT_PERMISSION', 'Campus Event Permission', 'non-academic', 'Approved facility, sound, and timing authorization pass', 'shield-check', ARRAY['student', 'faculty', 'staff'], true, false),
  ('66666666-6666-6666-6666-666666660010', 'HOSTEL_PASS', 'Hostel Gate & Room Pass', 'non-academic', 'Resident pass with biometric clearance and curfew extension', 'home', ARRAY['student'], true, true),
  ('66666666-6666-6666-6666-666666660011', 'TRANSPORT_PASS', 'Campus Transport Pass', 'non-academic', 'Metro shuttle and inter-campus transport boarding pass', 'bus', ARRAY['student', 'faculty', 'staff'], true, true),
  ('66666666-6666-6666-6666-666666660012', 'SOCIETY_MEMBERSHIP', 'Technical Society Membership', 'non-academic', 'Official credential for registered student clubs and bodies', 'users', ARRAY['student'], true, false),
  ('66666666-6666-6666-6666-666666660013', 'SPORTS_CREDENTIAL', 'Inter-College Sports Credential', 'non-academic', 'Recognized sports representation and medal certificate', 'activity', ARRAY['student'], true, false),
  ('66666666-6666-6666-6666-666666660014', 'LAB_ACCESS', 'Innovation Lab 24/7 Access', 'non-academic', 'Security clearance for advanced labs and prototyping spaces', 'key', ARRAY['student', 'faculty'], true, false),
  ('66666666-6666-6666-6666-666666660015', 'MEDICAL_LEAVE', 'Medical Leave Certificate', 'non-academic', 'Official medical excuse and clinic certificate', 'file-text', ARRAY['student'], true, false)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 8. Supabase Storage Bucket Configuration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'documents',
      'documents',
      false,
      10485760, -- 10MB
      ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  END IF;
END $$;
