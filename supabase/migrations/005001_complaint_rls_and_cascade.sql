-- ==============================================================================
-- Smart Campus: 005_complaint_rls_and_cascade.sql
-- 1. Campus-wide authenticated read policy for public.complaints
-- 2. Safe SECURITY DEFINER function for emergency cascade without general UPDATE grants
-- ==============================================================================

-- 1. Campus-Wide Read Policy
-- Replaces restrictive self-only select policy with campus-wide read for authenticated users
DROP POLICY IF EXISTS "Users can view their own complaints or assigned complaints" ON public.complaints;
DROP POLICY IF EXISTS "Campus complaints are viewable by authenticated users" ON public.complaints;

CREATE POLICY "Campus complaints are viewable by authenticated users"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (true);

-- 2. Narrow Emergency Cascade Function
-- Allows authenticated application code to transition a cluster to emergency
-- without granting general UPDATE permissions on public.complaints to students.
CREATE OR REPLACE FUNCTION public.cascade_complaint_emergency(target_cluster_id TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows INT;
BEGIN
  -- Strict input validation
  IF target_cluster_id IS NULL OR btrim(target_cluster_id) = '' THEN
    RAISE EXCEPTION 'Invalid cluster_id: cannot be null or empty';
  END IF;

  -- Strictly updates only is_emergency for the target cluster
  UPDATE public.complaints
  SET is_emergency = true,
      updated_at = timezone('utc'::text, now())
  WHERE cluster_id = target_cluster_id
    AND is_emergency = false;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows;
END;
$$;

-- 3. Execute Permissions
-- Revoke from PUBLIC, grant only to authenticated and service_role
REVOKE ALL ON FUNCTION public.cascade_complaint_emergency(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cascade_complaint_emergency(TEXT) TO authenticated, service_role;
