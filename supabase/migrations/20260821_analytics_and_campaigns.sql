-- ── Profiles: acquisition + referral columns ────────────────────────────
-- acquisition_source, acquisition_detail, campaign_tag: automated first-touch attribution.
-- referred_by: signup referral attribution (separate lifecycle from acquisition fields).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS acquisition_source  TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_detail  TEXT,
  ADD COLUMN IF NOT EXISTS campaign_tag        TEXT,
  ADD COLUMN IF NOT EXISTS referred_by         UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Indexes for analytics grouping queries
CREATE INDEX IF NOT EXISTS idx_profiles_acquisition_source ON profiles(acquisition_source);
CREATE INDEX IF NOT EXISTS idx_profiles_campaign_tag       ON profiles(campaign_tag);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by        ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at         ON profiles(created_at);

-- ── Campaigns table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'paused', 'completed')),
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Admins can manage campaigns'
  ) THEN
    CREATE POLICY "Admins can manage campaigns"
      ON campaigns FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_slug   ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- ── Campaign Links table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  source      TEXT        NOT NULL,          -- e.g. 'instagram', 'tiktok', 'discord'
  detail      TEXT,                          -- optional qualifier
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE campaign_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaign_links' AND policyname = 'Admins can manage campaign_links'
  ) THEN
    CREATE POLICY "Admins can manage campaign_links"
      ON campaign_links FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_links_campaign_id ON campaign_links(campaign_id);

-- ── Share Events table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id       UUID        NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  share_method  TEXT        NOT NULL DEFAULT 'native',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'share_events' AND policyname = 'Admins can read share_events'
  ) THEN
    CREATE POLICY "Admins can read share_events"
      ON share_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

-- No INSERT policy for clients. All writes go through Server Action using service role.

CREATE INDEX IF NOT EXISTS idx_share_events_created_at ON share_events(created_at);
CREATE INDEX IF NOT EXISTS idx_share_events_user_id    ON share_events(user_id);
CREATE INDEX IF NOT EXISTS idx_share_events_post_id    ON share_events(post_id);
