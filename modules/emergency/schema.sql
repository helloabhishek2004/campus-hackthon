-- Extend locations (assumes base table from Lost & Found exists, but ensures it can be created if missing)
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_name_key;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS parent_id       INT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS kind            TEXT NOT NULL DEFAULT 'building'
      CHECK (kind IN ('campus','building','floor','room','outdoor')),
  ADD COLUMN IF NOT EXISTS building_id     INT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS assembly_point  TEXT,
  ADD COLUMN IF NOT EXISTS qr_slug         TEXT UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS locations_parent_name ON locations (COALESCE(parent_id,0), name);

CREATE TABLE IF NOT EXISTS location_aliases (
  location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,
  PRIMARY KEY (location_id, alias)
);

CREATE TABLE IF NOT EXISTS incidents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref          TEXT UNIQUE NOT NULL,
  type                TEXT NOT NULL,
  location_id         INT  NOT NULL REFERENCES locations(id),
  priority            SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 4),
  status              TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','confirmed','responding','contained',
                                        'resolved','closed','dismissed')),
  summary             TEXT,
  summary_source      TEXT CHECK (summary_source IN ('ai','manual','template')),
  report_count        INT NOT NULL DEFAULT 1,
  distinct_reporters  INT NOT NULL DEFAULT 1,
  first_report_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_report_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_by        INT REFERENCES users(id),
  confirmed_at        TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  post_incident_notes TEXT,
  is_drill            BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref            TEXT UNIQUE NOT NULL,
  reporter_id           INT  NOT NULL REFERENCES users(id),
  client_request_id     UUID NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN
      ('fire','medical','accident','security_threat','natural_disaster',
       'hazmat','building_problem','missing_person','other')),
  location_id           INT  NOT NULL REFERENCES locations(id),
  location_note         TEXT,
  geo_lat               DOUBLE PRECISION,
  geo_lng               DOUBLE PRECISION,
  geo_accuracy_m        REAL,
  description           TEXT,
  is_drill              BOOLEAN NOT NULL DEFAULT false,

  rule_priority         SMALLINT NOT NULL,
  ml_priority           SMALLINT,
  priority              SMALLINT NOT NULL,

  status                TEXT NOT NULL DEFAULT 'submitted'
      CHECK (status IN ('submitted','acknowledged','verifying','verified','resolved','rejected')),
  rejection_reason      TEXT CHECK (rejection_reason IN
      ('duplicate','not_emergency','false_good_faith','false_malicious','test')),
  incident_id           UUID REFERENCES incidents(id),

  text_emb              vector(384),
  ml                    JSONB NOT NULL DEFAULT '{}',
  enrichment_status     TEXT NOT NULL DEFAULT 'pending'
      CHECK (enrichment_status IN ('pending','done','failed','skipped')),
  flags                 JSONB NOT NULL DEFAULT '{}',

  responders_notified_at TIMESTAMPTZ,
  acknowledged_by       INT REFERENCES users(id),
  acknowledged_at       TIMESTAMPTZ,
  verified_by           INT REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, client_request_id)
);
CREATE INDEX IF NOT EXISTS er_status_prio ON emergency_reports (status, priority, created_at);
CREATE INDEX IF NOT EXISTS er_incident    ON emergency_reports (incident_id);
CREATE INDEX IF NOT EXISTS er_reporter    ON emergency_reports (reporter_id, created_at DESC);

CREATE TABLE IF NOT EXISTS report_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('image','video')),
  path        TEXT NOT NULL,
  bytes       INT,
  captured_at TIMESTAMPTZ,
  hints       JSONB
);

CREATE TABLE IF NOT EXISTS alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id      UUID NOT NULL REFERENCES incidents(id),
  version          INT  NOT NULL DEFAULT 1,
  kind             TEXT NOT NULL CHECK (kind IN ('alert','update','all_clear')),
  severity         TEXT NOT NULL CHECK (severity IN ('advisory','warning','critical')),
  scope            TEXT NOT NULL CHECK (scope IN ('responders_only','audience','campus_wide')),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  translations     JSONB,
  audience         JSONB NOT NULL,
  channels         TEXT[] NOT NULL,
  is_drill         BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','pending_approval','approved','sending','sent','cancelled')),
  drafted_by       INT NOT NULL REFERENCES users(id),
  drafted_with_ai  BOOLEAN NOT NULL DEFAULT false,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_approvals (
  alert_id    UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  approver_id INT  NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, approver_id)
);

CREATE TABLE IF NOT EXISTS alert_deliveries (
  id           BIGSERIAL PRIMARY KEY,
  alert_id     UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id      INT  NOT NULL REFERENCES users(id),
  channel      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','sent','delivered','failed','skipped')),
  provider_ref TEXT,
  error        TEXT,
  sent_at      TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  UNIQUE (alert_id, user_id, channel)
);

CREATE TABLE IF NOT EXISTS alert_responses (
  alert_id   UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id    INT  NOT NULL REFERENCES users(id),
  response   TEXT NOT NULL CHECK (response IN ('safe','need_help')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, user_id)
);

CREATE TABLE IF NOT EXISTS duty_roster (
  id        SERIAL PRIMARY KEY,
  user_id   INT NOT NULL REFERENCES users(id),
  role      TEXT NOT NULL CHECK (role IN ('responder','security_head')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS duty_now ON duty_roster (starts_at, ends_at);

CREATE TABLE IF NOT EXISTS misuse_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID NOT NULL UNIQUE REFERENCES emergency_reports(id),
  user_id        INT  NOT NULL REFERENCES users(id),
  flagged_by     INT  NOT NULL REFERENCES users(id),
  flag_note      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','dismissed')),
  reviewed_by    INT REFERENCES users(id),
  reviewed_at    TIMESTAMPTZ,
  reviewer_note  TEXT,
  user_notified_at TIMESTAMPTZ,
  appeal_note    TEXT,
  appeal_outcome TEXT CHECK (appeal_outcome IN ('upheld','overturned')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_events (
  id          BIGSERIAL PRIMARY KEY,
  report_id   UUID REFERENCES emergency_reports(id),
  incident_id UUID REFERENCES incidents(id),
  actor_id    INT REFERENCES users(id),
  event       TEXT NOT NULL,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_access_log (
  id         BIGSERIAL PRIMARY KEY,
  report_id  UUID NOT NULL REFERENCES emergency_reports(id),
  viewer_id  INT  NOT NULL REFERENCES users(id),
  what       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
