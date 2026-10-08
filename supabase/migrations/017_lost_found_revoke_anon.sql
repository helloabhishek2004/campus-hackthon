-- Lost & Found is served through authenticated Next.js APIs. Remove the
-- default Data API table grants from anon as defense in depth.
REVOKE ALL ON public.lost_found_items,
  public.lost_found_item_images,
  public.lost_found_matches,
  public.lost_found_claims,
  public.lost_found_contact_reveals,
  public.lost_found_item_events,
  public.lost_found_notifications
FROM anon;
