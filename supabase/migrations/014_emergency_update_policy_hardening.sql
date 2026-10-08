-- Require authorization both before and after emergency row updates.
-- Without WITH CHECK, an UPDATE policy can allow protected ownership fields to
-- be reassigned even when the initial row is visible to the actor.

ALTER POLICY "Responders can update emergency reports"
  ON public.emergency_reports
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer', 'maintenance_officer')
    )
  );

ALTER POLICY "Authorized staff can update emergency alerts"
  ON public.emergency_alerts
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'faculty', 'department_head', 'security_officer')
    )
  );
