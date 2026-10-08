-- The Next.js auth route calls the masked lookup through the server-only
-- service-role client. Do not expose this SECURITY DEFINER RPC through PostgREST.
REVOKE ALL ON FUNCTION public.lookup_institutional_identity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_institutional_identity(TEXT) TO service_role;
