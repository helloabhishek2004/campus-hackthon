-- Remove direct authenticated execution of SECURITY DEFINER helpers.
-- Server-only code invokes these through the service-role client.
REVOKE ALL ON FUNCTION public.lookup_institutional_identity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_institutional_identity(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.cascade_complaint_emergency(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cascade_complaint_emergency(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.increment_post_likes(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_post_dislikes(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_post_comments(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_likes(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_post_dislikes(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_post_comments(UUID, INT) TO service_role;

-- Supabase recommends keeping extensions outside the exposed public schema.
ALTER EXTENSION vector SET SCHEMA extensions;
