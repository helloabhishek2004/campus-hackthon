-- ============================================================================
-- Smart Campus: 013_emergency_persistence.sql
-- Persistent Emergency reports, broadcasts, and safety check-ins.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_ref TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('fire', 'medical', 'accident', 'security_threat', 'natural_disaster', 'hazmat', 'building_problem', 'missing_person', 'other')),
  location_name TEXT NOT NULL,
  location_note TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  description TEXT NOT NULL,
  priority SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'verifying', 'verified', 'resolved', 'rejected')),
  reporter_name TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reporter_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_drill BOOLEAN NOT NULL DEFAULT false,
  dedupe_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('alert', 'update', 'all_clear')),
  severity TEXT NOT NULL CHECK (severity IN ('advisory', 'warning', 'critical')),
  scope TEXT NOT NULL CHECK (scope IN ('responders_only', 'audience', 'campus_wide')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channels TEXT[] NOT NULL CHECK (cardinality(channels) > 0),
  is_drill BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sending', 'sent', 'cancelled')),
  drafted_by_name TEXT NOT NULL,
  drafted_by_id TEXT NOT NULL,
  drafted_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assembly_point TEXT,
  action_required TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.emergency_check_ins (
  alert_id UUID NOT NULL REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('safe', 'need_help')),
  location_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (alert_id, user_id)
);

-- Preserve the two fictional demo records that were previously loaded from
-- emergency.json. They are ordinary persisted rows, not a runtime fallback.
INSERT INTO public.emergency_alerts (
  id, kind, severity, scope, title, body, channels, is_drill, status,
  drafted_by_name, drafted_by_id, assembly_point, action_required,
  dedupe_key, sent_at, created_at
) VALUES
  (
    '44444444-4444-4444-4444-444444440001', 'alert', 'warning', 'campus_wide',
    'SAFETY ADVISORY: Flash Storm & High Winds Warning',
    'Met department has issued yellow alert for high velocity winds across North Zone. Avoid open lawns and tree corridors near Academic Block B. Report waterlogging or broken branches immediately.',
    ARRAY['in_app', 'push'], false, 'sent',
    'Campus Security Head', 'system-seed', 'Student Center Atrium',
    'Stay indoors during heavy showers. Keep emergency lines clear.',
    'seed-alert-001', timezone('utc'::text, now() - interval '45 minutes'), timezone('utc'::text, now() - interval '50 minutes')
  ),
  (
    '44444444-4444-4444-4444-444444440002', 'all_clear', 'advisory', 'audience',
    'ALL CLEAR: Routine Fire Drill Completed at Science Complex',
    'The scheduled bi-annual emergency evacuation drill has concluded successfully. All exits are open, and normal class operations have resumed.',
    ARRAY['in_app'], true, 'sent',
    'Fire Safety Team', 'system-seed', 'Central Sports Ground',
    'Resume scheduled lab sessions.',
    'seed-alert-002', timezone('utc'::text, now() - interval '24 hours'), timezone('utc'::text, now() - interval '25 hours')
  )
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_emergency_reports_created_at ON public.emergency_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_reporter ON public.emergency_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts (status);
CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_alert ON public.emergency_check_ins (alert_id);

ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Emergency reports are visible to owners and responders"
  ON public.emergency_reports FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer', 'maintenance_officer')
    )
  );

CREATE POLICY "Students can create their own emergency reports"
  ON public.emergency_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()::text AND
    (reporter_profile_id IS NULL OR reporter_profile_id = auth.uid())
  );

CREATE POLICY "Responders can update emergency reports"
  ON public.emergency_reports FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer', 'maintenance_officer')
  ));

CREATE POLICY "Authenticated users can view emergency alerts"
  ON public.emergency_alerts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authorized staff can create emergency alerts"
  ON public.emergency_alerts FOR INSERT TO authenticated
  WITH CHECK (
    drafted_by_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer')
    )
  );

CREATE POLICY "Authorized staff can update emergency alerts"
  ON public.emergency_alerts FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer')
  ));

CREATE POLICY "Users can manage their own emergency check-in"
  ON public.emergency_check_ins FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Responders can view emergency check-ins"
  ON public.emergency_check_ins FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer')
    )
  );

REVOKE ALL ON public.emergency_reports, public.emergency_alerts, public.emergency_check_ins FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.emergency_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.emergency_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.emergency_check_ins TO authenticated;
