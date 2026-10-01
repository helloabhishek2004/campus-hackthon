-- ==============================================================================
-- Smart Campus: 002_lost_and_found.sql
-- Module 3: Lost & Found Schema with pgvector, verification, and audit logging
-- ==============================================================================

-- 1. Enable pgvector if available
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Locations Table (Designated campus pickup/drop points and areas)
CREATE TABLE IF NOT EXISTS public.lost_found_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campus_zone TEXT NOT NULL,
  building TEXT NOT NULL,
  floor TEXT,
  room TEXT,
  specific_spot TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Items Table (Lost & Found canonical records)
CREATE TYPE lost_found_item_type AS ENUM ('lost', 'found');

CREATE TYPE lost_found_item_status AS ENUM (
  'processing',
  'open',
  'in_claim',
  'handover',
  'resolved',
  'expired',
  'withdrawn'
);

CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type lost_found_item_type NOT NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  public_description TEXT NOT NULL,
  private_description TEXT, -- Hidden from public view; used exclusively for claim verification
  identifying_marks TEXT,    -- Distinct marks/serial numbers for verification
  location_id UUID REFERENCES public.lost_found_locations(id) ON DELETE SET NULL,
  location_description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  status lost_found_item_status NOT NULL DEFAULT 'processing',
  is_sensitive BOOLEAN NOT NULL DEFAULT false, -- Wallets, IDs, keys, sensitive electronics
  text_embedding vector(384),                  -- all-MiniLM-L6-v2 embedding dimension
  primary_image_embedding vector(512),         -- clip-ViT-B-32 embedding dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Item Images Table
CREATE TABLE IF NOT EXISTS public.lost_found_item_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  image_embedding vector(512),
  detected_objects JSONB DEFAULT '[]'::jsonb, -- YOLO detections / bounding boxes
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Matches Table (Cross-matching between lost and found items)
CREATE TYPE lost_found_match_band AS ENUM ('high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS public.lost_found_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_item_id UUID NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  found_item_id UUID NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  overall_score NUMERIC(5, 4) NOT NULL,
  match_band lost_found_match_band NOT NULL,
  score_breakdown JSONB NOT NULL, -- { image: x, text: y, category: z, location: w, time: t }
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_item_pair UNIQUE (lost_item_id, found_item_id)
);

-- 6. Claims Table (Claim & ownership verification workflow)
CREATE TYPE lost_found_claim_status AS ENUM (
  'pending',
  'questions_pending',
  'approved',
  'rejected',
  'withdrawn'
);

CREATE TYPE lost_found_handover_mode AS ENUM (
  'in_person',
  'campus_security',
  'department_office'
);

CREATE TABLE IF NOT EXISTS public.lost_found_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.lost_found_matches(id) ON DELETE SET NULL,
  status lost_found_claim_status NOT NULL DEFAULT 'pending',
  claim_text TEXT NOT NULL,
  verification_answers JSONB DEFAULT '[]'::jsonb,
  decision_notes TEXT,
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  handover_mode lost_found_handover_mode,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Contact Reveals Audit Table (Strict consent-controlled release)
CREATE TABLE IF NOT EXISTS public.lost_found_contact_reveals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES public.lost_found_claims(id) ON DELETE CASCADE,
  revealed_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  revealed_party_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Item Events Audit Log
CREATE TABLE IF NOT EXISTS public.lost_found_item_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.lost_found_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.lost_found_matches(id) ON DELETE SET NULL,
  claim_id UUID REFERENCES public.lost_found_claims(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Indexes for Fast Matching & Browsing
CREATE INDEX IF NOT EXISTS idx_lost_found_items_status ON public.lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_type ON public.lost_found_items(type);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_category ON public.lost_found_items(category);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_reporter ON public.lost_found_items(reporter_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_matches_score ON public.lost_found_matches(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_lost_found_claims_item ON public.lost_found_claims(item_id);

-- 11. Row Level Security (RLS)
ALTER TABLE public.lost_found_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_contact_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_item_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_notifications ENABLE ROW LEVEL SECURITY;

-- Locations: Viewable by all authenticated users
CREATE POLICY "Locations viewable by authenticated users"
  ON public.lost_found_locations FOR SELECT
  TO authenticated
  USING (true);

-- Items: Authenticated users can view open items, reporters can view their own
CREATE POLICY "Public items are viewable when open"
  ON public.lost_found_items FOR SELECT
  TO authenticated
  USING (
    status = 'open' OR
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security_officer')
    )
  );

CREATE POLICY "Authenticated users can create items"
  ON public.lost_found_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters or staff can update items"
  ON public.lost_found_items FOR UPDATE
  TO authenticated
  USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security_officer')
    )
  );

-- Matches: Viewable by reporters of either item or staff
CREATE POLICY "Matches viewable by item reporters or staff"
  ON public.lost_found_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_found_items
      WHERE (id = lost_item_id OR id = found_item_id) AND reporter_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security_officer')
    )
  );

-- Claims: Viewable by claimant, item reporter, or staff
CREATE POLICY "Claims viewable by claimant, finder, or staff"
  ON public.lost_found_claims FOR SELECT
  TO authenticated
  USING (
    claimant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.lost_found_items
      WHERE id = item_id AND reporter_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security_officer')
    )
  );

-- Contact Reveals: Strictly restricted to revealed party and recipient
CREATE POLICY "Contact reveals viewable only by authorized parties"
  ON public.lost_found_contact_reveals FOR SELECT
  TO authenticated
  USING (
    revealed_to = auth.uid() OR
    revealed_party_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security_officer')
    )
  );

-- Notifications: Users only see their own notifications
CREATE POLICY "Users view own notifications"
  ON public.lost_found_notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());
