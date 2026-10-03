-- ==============================================================================
-- Smart Campus: 006_campus_feed_performance.sql
-- Optimizations for Campus Feed: Compound Indexes, Atomic Counter Functions
-- ==============================================================================

-- 1. Compound Indexes for High Performance Cursor Pagination & Feed Queries
CREATE INDEX IF NOT EXISTS idx_campus_posts_feed_pagination 
  ON public.campus_posts (status, published_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_campus_posts_category_feed 
  ON public.campus_posts (status, category, published_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_campus_posts_audience_scope_feed 
  ON public.campus_posts (status, audience_scope, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_campus_posts_audience_dept_feed 
  ON public.campus_posts (status, audience_scope, audience_department_id, published_at DESC);

-- Batch reaction lookup index for single-query resolution of user reactions
CREATE INDEX IF NOT EXISTS idx_campus_post_reactions_user_posts 
  ON public.campus_post_reactions (user_profile_id, post_id);

-- Post comments fast active load index
CREATE INDEX IF NOT EXISTS idx_campus_post_comments_post_active 
  ON public.campus_post_comments (post_id, status, created_at ASC);

-- 2. Atomic Helper Functions for Post Metric Counters
CREATE OR REPLACE FUNCTION public.increment_post_likes(target_post_id UUID, delta INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.campus_posts
  SET likes_count = GREATEST(0, likes_count + delta),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_post_dislikes(target_post_id UUID, delta INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.campus_posts
  SET dislikes_count = GREATEST(0, dislikes_count + delta),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_post_comments(target_post_id UUID, delta INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.campus_posts
  SET comments_count = GREATEST(0, comments_count + delta),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_post_id;
END;
$$;
