-- ==============================================================================
-- Smart Campus: Seed Data
-- ==============================================================================

COMMENT ON TABLE public.complaints IS 'Stores student & campus grievances.';
COMMENT ON TABLE public.complaint_ai_analysis IS 'Stores Module 2 AI processing results.';

-- Load Institutional Seed (50 deterministic users, departments, programs, tags)
\i supabase/seed/003_institutional_seed.sql
