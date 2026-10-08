-- Lost & Found workflow policies for the existing tables.
-- These policies keep the authenticated Supabase session as the database
-- authorization boundary. Background workers use the server-only service role.

DROP POLICY IF EXISTS "Item images viewable with item" ON public.lost_found_item_images;
CREATE POLICY "Item images viewable with item"
  ON public.lost_found_item_images FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_found_items i
      WHERE i.id = item_id
        AND (i.status = 'open' OR i.reporter_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'security_officer')
        ))
    )
  );

DROP POLICY IF EXISTS "Owners insert item images" ON public.lost_found_item_images;
CREATE POLICY "Owners insert item images"
  ON public.lost_found_item_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lost_found_items i
    WHERE i.id = item_id AND i.reporter_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users create claims for themselves" ON public.lost_found_claims;
CREATE POLICY "Users create claims for themselves"
  ON public.lost_found_claims FOR INSERT TO authenticated
  WITH CHECK (claimant_id = auth.uid());

DROP POLICY IF EXISTS "Claimants or item owners update claims" ON public.lost_found_claims;
CREATE POLICY "Claimants or item owners update claims"
  ON public.lost_found_claims FOR UPDATE TO authenticated
  USING (
    claimant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lost_found_items i
      WHERE i.id = item_id AND i.reporter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'security_officer')
    )
  )
  WITH CHECK (claimant_id = claimant_id);

DROP POLICY IF EXISTS "Authorized parties create contact reveals" ON public.lost_found_contact_reveals;
CREATE POLICY "Authorized parties create contact reveals"
  ON public.lost_found_contact_reveals FOR INSERT TO authenticated
  WITH CHECK (
    revealed_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lost_found_claims c
      WHERE c.id = claim_id
        AND c.status = 'approved'
        AND (c.claimant_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.lost_found_items i
          WHERE i.id = c.item_id AND i.reporter_id = auth.uid()
        ))
    )
  );

DROP POLICY IF EXISTS "Actors create item events" ON public.lost_found_item_events;
CREATE POLICY "Actors create item events"
  ON public.lost_found_item_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "Staff view item events" ON public.lost_found_item_events;
CREATE POLICY "Staff view item events"
  ON public.lost_found_item_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'security_officer')
  ));

DROP POLICY IF EXISTS "Reporters or staff dismiss matches" ON public.lost_found_matches;
CREATE POLICY "Reporters or staff dismiss matches"
  ON public.lost_found_matches FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_found_items i
      WHERE (i.id = lost_item_id OR i.id = found_item_id)
        AND i.reporter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'security_officer')
    )
  )
  WITH CHECK (dismissed_by = auth.uid() OR is_dismissed = false);
