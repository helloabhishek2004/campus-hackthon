-- ==============================================================================
-- Smart Campus: 003_institutional_identity.sql
-- Normalized departments, programs, institutional identity, biodata & role tags
-- ==============================================================================

-- 1. Roles & Tag Enums
DO $$ BEGIN
  CREATE TYPE institutional_role AS ENUM (
    'student',
    'faculty',
    'staff',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE institutional_tag AS ENUM (
    'CAS_COORDINATOR',
    'DEPARTMENT_COORDINATOR',
    'COURSE_COORDINATOR',
    'CLASS_COORDINATOR',
    'HOD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Departments Catalog
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Academic Programs
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  degree TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  duration_years INT NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Institutional Users (Master Biodata Source)
CREATE TABLE IF NOT EXISTS public.institutional_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institutional_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL, -- Sensitive, raw phone (e.g. +919876543210)
  email TEXT NOT NULL UNIQUE,
  primary_role institutional_role NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Student Specific Biodata
CREATE TABLE IF NOT EXISTS public.student_biodata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institutional_user_id UUID NOT NULL UNIQUE REFERENCES public.institutional_users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  admission_year INT NOT NULL,
  graduation_year INT NOT NULL,
  academic_year INT NOT NULL DEFAULT 1,
  current_semester INT NOT NULL DEFAULT 1,
  section TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Faculty Specific Biodata
CREATE TABLE IF NOT EXISTS public.faculty_biodata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institutional_user_id UUID NOT NULL UNIQUE REFERENCES public.institutional_users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  designation TEXT NOT NULL,
  joining_year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Institutional Responsibility Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.institutional_user_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institutional_user_id UUID NOT NULL REFERENCES public.institutional_users(id) ON DELETE CASCADE,
  tag institutional_tag NOT NULL,
  scope TEXT, -- Optional contextual scope, e.g. "Year 3 Sem 2", "Dept Level", "CS302"
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(institutional_user_id, tag)
);

-- 8. Simulated OTP Verification Sessions (Auth Challenges)
CREATE TABLE IF NOT EXISTS public.institutional_otp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institutional_user_id UUID NOT NULL REFERENCES public.institutional_users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Indexes for High Performance Lookups
CREATE INDEX IF NOT EXISTS idx_inst_users_lookup ON public.institutional_users (institutional_id);
CREATE INDEX IF NOT EXISTS idx_inst_users_role ON public.institutional_users (primary_role);
CREATE INDEX IF NOT EXISTS idx_inst_users_linked ON public.institutional_users (linked_profile_id);
CREATE INDEX IF NOT EXISTS idx_student_biodata_dept ON public.student_biodata (department_id);
CREATE INDEX IF NOT EXISTS idx_student_biodata_prog ON public.student_biodata (program_id);
CREATE INDEX IF NOT EXISTS idx_faculty_biodata_dept ON public.faculty_biodata (department_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_user ON public.institutional_user_tags (institutional_user_id);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_user ON public.institutional_otp_sessions (institutional_user_id, expires_at);

-- 10. Phone Masking Utility
CREATE OR REPLACE FUNCTION public.mask_phone(raw_phone TEXT)
RETURNS TEXT AS $$
BEGIN
  IF raw_phone IS NULL OR length(trim(raw_phone)) = 0 THEN
    RETURN '******';
  END IF;

  raw_phone := trim(raw_phone);
  IF length(raw_phone) <= 4 THEN
    RETURN repeat('*', length(raw_phone));
  END IF;

  -- Retain the last 4 digits, mask prior digits preserving prefix format if applicable
  RETURN repeat('*', length(raw_phone) - 4) || right(raw_phone, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. Secure Institutional Identity Lookup (Prevents Raw Phone Exposure)
CREATE OR REPLACE FUNCTION public.lookup_institutional_identity(p_institutional_id TEXT)
RETURNS TABLE (
  id UUID,
  institutional_id TEXT,
  full_name TEXT,
  masked_phone TEXT,
  primary_role institutional_role,
  department_code TEXT,
  department_name TEXT,
  program_code TEXT,
  program_name TEXT,
  academic_year INT,
  current_semester INT,
  section TEXT,
  designation TEXT,
  tags TEXT[],
  is_active BOOLEAN
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.institutional_id,
    u.full_name,
    public.mask_phone(u.phone) AS masked_phone,
    u.primary_role,
    COALESCE(sd.code, fd.code) AS department_code,
    COALESCE(sd.name, fd.name) AS department_name,
    sp.code AS program_code,
    sp.name AS program_name,
    sb.academic_year,
    sb.current_semester,
    sb.section,
    fb.designation,
    COALESCE(
      (SELECT array_agg(t.tag::TEXT) FROM public.institutional_user_tags t WHERE t.institutional_user_id = u.id),
      ARRAY[]::TEXT[]
    ) AS tags,
    u.is_active
  FROM public.institutional_users u
  LEFT JOIN public.student_biodata sb ON sb.institutional_user_id = u.id
  LEFT JOIN public.departments sd ON sd.id = sb.department_id
  LEFT JOIN public.programs sp ON sp.id = sb.program_id
  LEFT JOIN public.faculty_biodata fb ON fb.institutional_user_id = u.id
  LEFT JOIN public.departments fd ON fd.id = fb.department_id
  WHERE UPPER(u.institutional_id) = UPPER(p_institutional_id);
END;
$$ LANGUAGE plpgsql;

-- 12. Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_biodata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_biodata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_otp_sessions ENABLE ROW LEVEL SECURITY;

-- Read policies for general catalogs
CREATE POLICY "Departments are viewable by all"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Programs are viewable by all"
  ON public.programs FOR SELECT
  USING (true);

-- Institutional biodata is strictly locked down:
-- Raw phone and records are NOT directly queryable by anonymous clients
CREATE POLICY "Users can view their own institutional profile"
  ON public.institutional_users FOR SELECT
  TO authenticated
  USING (linked_profile_id = auth.uid());

CREATE POLICY "Users can view their own student biodata"
  ON public.student_biodata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users iu
      WHERE iu.id = student_biodata.institutional_user_id AND iu.linked_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own faculty biodata"
  ON public.faculty_biodata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users iu
      WHERE iu.id = faculty_biodata.institutional_user_id AND iu.linked_profile_id = auth.uid()
    )
  );

CREATE POLICY "Tags are viewable by authenticated users"
  ON public.institutional_user_tags FOR SELECT
  TO authenticated
  USING (true);

-- Grant lookup function execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.lookup_institutional_identity(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mask_phone(TEXT) TO anon, authenticated, service_role;
