-- ==============================================================================
-- Smart Campus: 001_initial_schema.sql
-- Foundation tables for users, roles, departments, complaints, posts & AI analysis
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles & Profiles
CREATE TYPE user_role AS ENUM (
  'student',
  'faculty',
  'department_head',
  'maintenance_officer',
  'security_officer',
  'admin'
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department TEXT,
  student_id TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Campus Posts & Announcements (Module 1)
CREATE TYPE post_category AS ENUM (
  'announcement',
  'event',
  'circular',
  'emergency',
  'general'
);

CREATE TYPE post_scope AS ENUM (
  'campus_wide',
  'departmental',
  'hostel',
  'faculty_only'
);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category post_category NOT NULL DEFAULT 'general',
  scope post_scope NOT NULL DEFAULT 'campus_wide',
  target_department TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Complaints (Canonical Records Owned by Module 1)
CREATE TYPE complaint_status AS ENUM (
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
  'rejected'
);

CREATE TYPE complaint_severity_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complainant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'submitted',
  category TEXT,
  subcategory TEXT,
  location_building TEXT,
  location_room TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Complaint AI Analysis (Module 2 Output Storage)
CREATE TABLE IF NOT EXISTS public.complaint_ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  title_summary TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity_level complaint_severity_level NOT NULL,
  severity_score NUMERIC(4, 2) NOT NULL,
  urgency_reasoning TEXT NOT NULL,
  location_data JSONB,
  entities JSONB DEFAULT '[]'::jsonb,
  suggested_department TEXT NOT NULL,
  suggested_role TEXT,
  recipient_confidence NUMERIC(3, 2),
  cluster_match JSONB,
  overall_confidence NUMERIC(3, 2) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Basic Read Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Posts are viewable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own complaints or assigned complaints"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (
    auth.uid() = complainant_id OR
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'department_head', 'maintenance_officer', 'security_officer')
    )
  );

CREATE POLICY "Authenticated users can create complaints"
  ON public.complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = complainant_id);
