-- Require ownership/authorization both before and after Lost & Found updates.

ALTER POLICY "Reporters or staff can update items"
  ON public.lost_found_items
  WITH CHECK (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'security_officer')
    )
  );

ALTER POLICY "Claimants or item owners update claims"
  ON public.lost_found_claims
  WITH CHECK (
    claimant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lost_found_items i
      WHERE i.id = item_id AND i.reporter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'security_officer')
    )
  );
