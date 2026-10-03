-- ==============================================================================
-- Smart Campus: 007_faculty_academic_documents.sql
-- Faculty academic assignments, courses, formal academic documents, recipients & RLS
-- ==============================================================================

-- 1. Courses Catalog
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  semester INT NOT NULL,
  credits INT NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Faculty Academic Assignments (Department, Program, Class, Course)
CREATE TABLE IF NOT EXISTS public.faculty_academic_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_institutional_user_id UUID NOT NULL REFERENCES public.institutional_users(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('department', 'program', 'class', 'course')),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  academic_year INT,
  semester INT,
  section TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  academic_session TEXT NOT NULL DEFAULT '2025-2026',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Academic Documents (Formal notices, assignments, circulars, etc.)
CREATE TABLE IF NOT EXISTS public.academic_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_institutional_user_id UUID REFERENCES public.institutional_users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_department TEXT,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('DRAFT', 'SENT', 'DELIVERED', 'READ', 'ARCHIVED')),
  target_scope TEXT NOT NULL CHECK (target_scope IN ('class', 'course', 'program', 'department', 'faculty', 'cross_department', 'campus')),
  target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  target_department_code TEXT,
  target_program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  target_program_code TEXT,
  target_academic_year INT,
  target_semester INT,
  target_section TEXT,
  target_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  target_course_name TEXT,
  target_display_name TEXT NOT NULL,
  delivery_count INT NOT NULL DEFAULT 0,
  read_count INT NOT NULL DEFAULT 0,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Academic Document Recipients & Read Status
CREATE TABLE IF NOT EXISTS public.academic_document_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.academic_documents(id) ON DELETE CASCADE,
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_institutional_user_id UUID NOT NULL REFERENCES public.institutional_users(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('student', 'faculty', 'staff', 'admin')),
  recipient_name TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(document_id, recipient_institutional_user_id)
);

-- 5. Academic Document Events (Tamper-Resistant Log)
CREATE TABLE IF NOT EXISTS public.academic_document_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.academic_documents(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('DOCUMENT_CREATED', 'DOCUMENT_SENT', 'DOCUMENT_DELIVERED', 'DOCUMENT_READ', 'DOCUMENT_ARCHIVED')),
  event_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_courses_dept ON public.courses (department_id);
CREATE INDEX IF NOT EXISTS idx_courses_prog ON public.courses (program_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assign_user ON public.faculty_academic_assignments (faculty_institutional_user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assign_active ON public.faculty_academic_assignments (is_active);
CREATE INDEX IF NOT EXISTS idx_faculty_assign_course ON public.faculty_academic_assignments (course_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assign_dept ON public.faculty_academic_assignments (department_id);

CREATE INDEX IF NOT EXISTS idx_acad_docs_sender ON public.academic_documents (sender_profile_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acad_docs_scope ON public.academic_documents (target_scope, status);
CREATE INDEX IF NOT EXISTS idx_acad_docs_created ON public.academic_documents (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_acad_doc_recipients_user ON public.academic_document_recipients (recipient_institutional_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acad_doc_recipients_doc ON public.academic_document_recipients (document_id);
CREATE INDEX IF NOT EXISTS idx_acad_doc_events_doc ON public.academic_document_events (document_id);

-- 7. Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_academic_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_document_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_document_events ENABLE ROW LEVEL SECURITY;

-- Courses: Read by authenticated
CREATE POLICY "courses_read_authenticated"
  ON public.courses
  FOR SELECT
  USING (true);

-- Faculty Assignments: Read by authenticated
CREATE POLICY "faculty_assignments_read_authenticated"
  ON public.faculty_academic_assignments
  FOR SELECT
  USING (true);

-- Academic Documents: Read if sender or recipient
CREATE POLICY "academic_documents_select"
  ON public.academic_documents
  FOR SELECT
  USING (
    sender_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.academic_document_recipients adr
      WHERE adr.document_id = public.academic_documents.id
      AND (
        adr.recipient_profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.institutional_users iu
          WHERE iu.linked_profile_id = auth.uid()
          AND iu.id = adr.recipient_institutional_user_id
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Academic Documents: Insert by authorized faculty or admin
CREATE POLICY "academic_documents_insert"
  ON public.academic_documents
  FOR INSERT
  WITH CHECK (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('faculty', 'admin', 'department_head')
    )
  );

-- Academic Documents: Update by author or admin
CREATE POLICY "academic_documents_update"
  ON public.academic_documents
  FOR UPDATE
  USING (
    sender_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Recipients: Select
CREATE POLICY "academic_document_recipients_select"
  ON public.academic_document_recipients
  FOR SELECT
  USING (
    recipient_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.institutional_users iu
      WHERE iu.linked_profile_id = auth.uid()
      AND iu.id = recipient_institutional_user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_documents ad
      WHERE ad.id = document_id
      AND ad.sender_profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Recipients: Update is_read by recipient
CREATE POLICY "academic_document_recipients_update_read"
  ON public.academic_document_recipients
  FOR UPDATE
  USING (
    recipient_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.institutional_users iu
      WHERE iu.linked_profile_id = auth.uid()
      AND iu.id = recipient_institutional_user_id
    )
  );

-- Events: Select
CREATE POLICY "academic_document_events_select"
  ON public.academic_document_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.academic_documents ad
      WHERE ad.id = document_id
      AND (
        ad.sender_profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "academic_document_events_insert"
  ON public.academic_document_events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
