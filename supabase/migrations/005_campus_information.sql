-- ==============================================================================
-- Smart Campus: 005_campus_information.sql
-- Student information publishing system: posts, attachments, reactions, comments, verifications
-- ==============================================================================

-- 1. Campus Posts Table
CREATE TABLE IF NOT EXISTS public.campus_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_institutional_user_id UUID REFERENCES public.institutional_users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_role_category TEXT NOT NULL CHECK (author_role_category IN ('regular_student', 'student_coordinator', 'department_coordinator', 'faculty', 'admin')),
  author_department TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'non-academic')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'removed')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  verified_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verifier_name TEXT,
  verifier_role TEXT,
  verifier_department TEXT,
  verified_at TIMESTAMPTZ,
  verification_scope TEXT,
  verification_note TEXT,
  audience_scope TEXT NOT NULL CHECK (audience_scope IN ('campus', 'department', 'program', 'class', 'students')),
  audience_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  audience_department_code TEXT,
  audience_program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  audience_program_code TEXT,
  audience_academic_year INT,
  audience_semester INT,
  audience_section TEXT,
  audience_display_name TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  dislikes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Campus Post Attachments
CREATE TABLE IF NOT EXISTS public.campus_post_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Campus Post Reactions (Mutually exclusive Like/Dislike)
CREATE TABLE IF NOT EXISTS public.campus_post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_profile_id)
);

-- 4. Campus Post Comments
CREATE TABLE IF NOT EXISTS public.campus_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'student',
  author_role_category TEXT CHECK (author_role_category IN ('regular_student', 'student_coordinator', 'department_coordinator', 'faculty', 'admin')),
  author_department TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Campus Post Verifications Audit Log
CREATE TABLE IF NOT EXISTS public.campus_post_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  verified_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verifier_name TEXT NOT NULL,
  verifier_role TEXT NOT NULL,
  verifier_department TEXT,
  status TEXT NOT NULL CHECK (status IN ('verified', 'rejected')),
  scope TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_campus_posts_author ON public.campus_posts (author_profile_id);
CREATE INDEX IF NOT EXISTS idx_campus_posts_category ON public.campus_posts (category);
CREATE INDEX IF NOT EXISTS idx_campus_posts_status ON public.campus_posts (status);
CREATE INDEX IF NOT EXISTS idx_campus_posts_scope ON public.campus_posts (audience_scope);
CREATE INDEX IF NOT EXISTS idx_campus_posts_dept ON public.campus_posts (audience_department_id);
CREATE INDEX IF NOT EXISTS idx_campus_posts_published ON public.campus_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_campus_post_att_post ON public.campus_post_attachments (post_id);
CREATE INDEX IF NOT EXISTS idx_campus_post_rxn_post ON public.campus_post_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_campus_post_comm_post ON public.campus_post_comments (post_id);

-- 7. Row Level Security (RLS)
ALTER TABLE public.campus_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_post_verifications ENABLE ROW LEVEL SECURITY;

-- Post Visibility: visible if author OR audience is campus/students OR user matches target department/program/class
CREATE POLICY "campus_posts_select_policy"
  ON public.campus_posts
  FOR SELECT
  USING (
    status = 'published'
    AND (
      author_profile_id = auth.uid()
      OR audience_scope IN ('campus', 'students')
      OR EXISTS (
        SELECT 1 FROM public.student_biodata sb
        JOIN public.institutional_users iu ON iu.id = sb.institutional_user_id
        WHERE iu.linked_profile_id = auth.uid()
        AND (
          (audience_scope = 'department' AND sb.department_id = audience_department_id)
          OR (audience_scope = 'program' AND sb.program_id = audience_program_id)
          OR (audience_scope = 'class' AND sb.academic_year = audience_academic_year AND sb.current_semester = audience_semester AND sb.section = audience_section)
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty', 'department_head')
      )
    )
  );

-- Post Insertion: must be authenticated
CREATE POLICY "campus_posts_insert_policy"
  ON public.campus_posts
  FOR INSERT
  WITH CHECK (
    author_profile_id = auth.uid()
  );

-- Post Updates: author or admin
CREATE POLICY "campus_posts_update_policy"
  ON public.campus_posts
  FOR UPDATE
  USING (
    author_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty')
    )
  );

-- Post Deletion: author or admin
CREATE POLICY "campus_posts_delete_policy"
  ON public.campus_posts
  FOR DELETE
  USING (
    author_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Reactions Policies
CREATE POLICY "campus_post_reactions_select"
  ON public.campus_post_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "campus_post_reactions_all"
  ON public.campus_post_reactions
  FOR ALL
  USING (user_profile_id = auth.uid())
  WITH CHECK (user_profile_id = auth.uid());

-- Comments Policies
CREATE POLICY "campus_post_comments_select"
  ON public.campus_post_comments
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "campus_post_comments_insert"
  ON public.campus_post_comments
  FOR INSERT
  WITH CHECK (author_profile_id = auth.uid());

CREATE POLICY "campus_post_comments_update"
  ON public.campus_post_comments
  FOR UPDATE
  USING (
    author_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "campus_post_comments_delete"
  ON public.campus_post_comments
  FOR DELETE
  USING (
    author_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Verifications Policies
CREATE POLICY "campus_post_verifications_select"
  ON public.campus_post_verifications
  FOR SELECT
  USING (true);

CREATE POLICY "campus_post_verifications_insert"
  ON public.campus_post_verifications
  FOR INSERT
  WITH CHECK (verified_by_profile_id = auth.uid());
