-- Complaint Phase 2: durable lifecycle notes/history and atomic writes.
-- This migration is additive; it does not alter the existing complaint enum or
-- weaken complaint RLS.

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS response_note TEXT,
  ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  from_status complaint_status NOT NULL,
  to_status complaint_status NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_complaint_status_history_complaint
  ON public.complaint_status_history(complaint_id, created_at DESC);

ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.complaint_status_history FROM anon, authenticated;
GRANT ALL ON TABLE public.complaint_status_history TO service_role;

-- The web server performs authorization before calling this service-role-only
-- function. The function makes the complaint update and its history insert one
-- transaction, so a failed history write cannot leave a partial status change.
CREATE OR REPLACE FUNCTION public.update_complaint_lifecycle(
  target_complaint_id UUID,
  next_status complaint_status,
  next_assigned_to UUID,
  next_response_note TEXT,
  actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_status complaint_status;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Complaint lifecycle actor is required';
  END IF;

  SELECT status INTO current_status
  FROM public.complaints
  WHERE id = target_complaint_id
  FOR UPDATE;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Complaint not found';
  END IF;

  IF current_status <> next_status AND NOT (
    (current_status = 'submitted' AND next_status IN ('under_review', 'rejected')) OR
    (current_status = 'under_review' AND next_status IN ('in_progress', 'rejected')) OR
    (current_status = 'in_progress' AND next_status IN ('under_review', 'resolved', 'rejected')) OR
    (current_status IN ('resolved', 'rejected') AND next_status = 'under_review')
  ) THEN
    RAISE EXCEPTION 'Invalid complaint status transition from % to %', current_status, next_status;
  END IF;

  IF next_status IN ('resolved', 'rejected') AND nullif(btrim(next_response_note), '') IS NULL THEN
    RAISE EXCEPTION 'A response note is required for resolved or rejected complaints';
  END IF;

  UPDATE public.complaints
  SET status = next_status,
      assigned_to = next_assigned_to,
      response_note = nullif(btrim(next_response_note), ''),
      last_updated_by = actor_id,
      updated_at = timezone('utc'::text, now())
  WHERE id = target_complaint_id;

  IF current_status <> next_status THEN
    INSERT INTO public.complaint_status_history(
      complaint_id, from_status, to_status, actor_id, note
    ) VALUES (
      target_complaint_id, current_status, next_status,
      actor_id, nullif(btrim(next_response_note), '')
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_complaint_lifecycle(UUID, complaint_status, UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_complaint_lifecycle(UUID, complaint_status, UUID, TEXT, UUID)
  TO service_role;

-- Keep the threshold cascade and the new complaint insert atomic. Similarity
-- remains application-owned; this function owns only the final persistence step.
CREATE OR REPLACE FUNCTION public.persist_complaint_with_emergency(
  p_id UUID,
  p_complainant_id UUID,
  p_text TEXT,
  p_status complaint_status,
  p_category TEXT,
  p_location_building TEXT,
  p_location_room TEXT,
  p_attachments JSONB,
  p_cluster_id TEXT,
  p_is_emergency BOOLEAN,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_is_emergency THEN
    UPDATE public.complaints
    SET is_emergency = true,
        updated_at = timezone('utc'::text, now())
    WHERE cluster_id = p_cluster_id;
  END IF;

  INSERT INTO public.complaints(
    id, complainant_id, text, status, category,
    location_building, location_room, attachments,
    cluster_id, is_emergency, created_at, updated_at
  ) VALUES (
    p_id, p_complainant_id, p_text, p_status, p_category,
    p_location_building, p_location_room, COALESCE(p_attachments, '[]'::jsonb),
    p_cluster_id, p_is_emergency, p_created_at, p_updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.persist_complaint_with_emergency(
  UUID, UUID, TEXT, complaint_status, TEXT, TEXT, TEXT, JSONB, TEXT, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_complaint_with_emergency(
  UUID, UUID, TEXT, complaint_status, TEXT, TEXT, TEXT, JSONB, TEXT, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ
) TO service_role;
