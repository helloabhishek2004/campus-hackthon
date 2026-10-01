-- ==============================================================================
-- Smart Campus: 004_complaint_clusters.sql
-- Add cluster_id and is_emergency to complaints for text-based grouping & emergency classification
-- ==============================================================================

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS cluster_id TEXT,
  ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN NOT NULL DEFAULT false;

-- Create an index on cluster_id for fast group lookups and counts
CREATE INDEX IF NOT EXISTS idx_complaints_cluster_id ON public.complaints(cluster_id);

-- Create an index on is_emergency for fast filtering between normal and emergency complaints
CREATE INDEX IF NOT EXISTS idx_complaints_is_emergency ON public.complaints(is_emergency);

-- Helper view for complaint groups with dynamic member counts (without storing redundant counters)
CREATE OR REPLACE VIEW public.complaint_cluster_summary AS
SELECT
  cluster_id,
  COUNT(*)::INT AS group_count,
  BOOL_OR(is_emergency) AS is_emergency,
  MIN(created_at) AS first_reported_at,
  MAX(created_at) AS last_reported_at
FROM public.complaints
WHERE cluster_id IS NOT NULL
GROUP BY cluster_id;
