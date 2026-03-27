-- ============================================================
-- COMORA — Initial Schema Migration
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for full-text search

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  avatar_url          TEXT,
  bio                 TEXT,
  city                TEXT,
  role                TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest','host','admin')),

  -- Match Me fields
  interests           TEXT[]   DEFAULT '{}',
  social_comfort      INTEGER  DEFAULT 3 CHECK (social_comfort BETWEEN 1 AND 5),
  preferred_group_min INTEGER  DEFAULT 4,
  preferred_group_max INTEGER  DEFAULT 10,
  dietary_prefs       TEXT[]   DEFAULT '{}',
  budget_range        TEXT     DEFAULT 'moderate' CHECK (budget_range IN ('free','low','moderate','high')),
  location_radius_km  INTEGER  DEFAULT 15,
  match_me_completed  BOOLEAN  DEFAULT FALSE,

  -- Host-specific
  expertise_tags      TEXT[]   DEFAULT '{}',
  phone               TEXT,
  verification_level  TEXT     DEFAULT 'none' CHECK (verification_level IN ('none','light','medium','strong')),
  host_verified       BOOLEAN  DEFAULT FALSE,
  host_verified_at    TIMESTAMPTZ,
  host_verified_by    UUID,

  -- Guest reliability
  rsvp_reliability    NUMERIC(3,2) DEFAULT 5.00,
  total_rsvps         INTEGER  DEFAULT 0,
  total_cancellations INTEGER  DEFAULT 0,

  -- Reputation
  avg_rating          NUMERIC(3,2),
  total_reviews       INTEGER  DEFAULT 0,

  status              TEXT     DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────
CREATE TABLE public.events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  agenda_type         TEXT NOT NULL,   -- book_club, debate, workshop, etc.
  topic_tags          TEXT[]  DEFAULT '{}',
  vibe_tags           TEXT[]  DEFAULT '{}',

  -- Vibe sliders (1–5)
  vibe_structure      INTEGER DEFAULT 3 CHECK (vibe_structure  BETWEEN 1 AND 5),
  vibe_energy         INTEGER DEFAULT 3 CHECK (vibe_energy     BETWEEN 1 AND 5),
  vibe_expertise      INTEGER DEFAULT 3 CHECK (vibe_expertise  BETWEEN 1 AND 5),

  -- Scheduling
  date_time           TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER NOT NULL DEFAULT 120,

  -- Venue
  venue_type          TEXT    DEFAULT 'home' CHECK (venue_type IN ('home','cafe','hall','park','other')),
  venue_name          TEXT,
  venue_address       TEXT,   -- encrypted at rest; shown only to confirmed guests
  venue_city          TEXT,
  venue_lat           NUMERIC(9,6),
  venue_lng           NUMERIC(9,6),

  -- Capacity & pricing
  max_guests          INTEGER NOT NULL DEFAULT 8,
  current_guests      INTEGER NOT NULL DEFAULT 0,
  price               NUMERIC(10,2) DEFAULT 0,
  cancellation_policy TEXT    DEFAULT '48h' CHECK (cancellation_policy IN ('none','24h','48h','72h')),

  -- Registration
  registration_mode   TEXT    DEFAULT 'open' CHECK (registration_mode IN ('open','request','invite')),

  -- Food layer
  cuisine_type        TEXT,
  dietary_options     TEXT[]  DEFAULT '{}',

  -- Status
  status              TEXT    DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','live','cancelled','completed')),
  rejection_reason    TEXT,

  -- Counts
  view_count          INTEGER DEFAULT 0,
  waitlist_count      INTEGER DEFAULT 0,

  -- Ratings cache
  avg_agenda_quality  NUMERIC(3,2),
  avg_host_warmth     NUMERIC(3,2),
  avg_food_accuracy   NUMERIC(3,2),
  avg_group_vibe      NUMERIC(3,2),
  avg_overall         NUMERIC(3,2),
  review_count        INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_host_id   ON public.events(host_id);
CREATE INDEX idx_events_status    ON public.events(status);
CREATE INDEX idx_events_date_time ON public.events(date_time);
CREATE INDEX idx_events_city      ON public.events(venue_city);
CREATE INDEX idx_events_tags      ON public.events USING GIN(topic_tags);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────────
CREATE TABLE public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  guest_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  status          TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','waitlisted','cancelled','attended')),
  waitlist_pos    INTEGER,

  -- Simulated payment
  payment_status  TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','free')),
  amount_paid     NUMERIC(10,2) DEFAULT 0,

  -- Screening (for request-to-join events)
  screening_answers JSONB,
  approved_by     UUID REFERENCES public.profiles(id),
  approved_at     TIMESTAMPTZ,

  cancellation_reason TEXT,
  cancelled_at    TIMESTAMPTZ,

  booked_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, guest_id)
);

CREATE INDEX idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX idx_bookings_status   ON public.bookings(status);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: update event guest count on booking change
CREATE OR REPLACE FUNCTION public.sync_event_guest_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET
    current_guests = (
      SELECT COUNT(*) FROM public.bookings
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
        AND status = 'confirmed'
    ),
    waitlist_count = (
      SELECT COUNT(*) FROM public.bookings
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
        AND status = 'waitlisted'
    )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_guest_count
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_guest_count();

-- ─────────────────────────────────────────────
-- COMMUNITIES
-- ─────────────────────────────────────────────
CREATE TABLE public.communities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  topic_tags   TEXT[]  DEFAULT '{}',
  city         TEXT,
  avatar_url   TEXT,
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  member_count INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.community_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
  role         TEXT DEFAULT 'member' CHECK (role IN ('member','moderator')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- ─────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE public.reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id       UUID NOT NULL REFERENCES public.events(id)    ON DELETE CASCADE,
  reviewer_id    UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  host_id        UUID NOT NULL REFERENCES public.profiles(id),

  -- 4-axis ratings (1–5)
  agenda_quality INTEGER NOT NULL CHECK (agenda_quality BETWEEN 1 AND 5),
  host_warmth    INTEGER NOT NULL CHECK (host_warmth    BETWEEN 1 AND 5),
  food_accuracy  INTEGER NOT NULL CHECK (food_accuracy  BETWEEN 1 AND 5),
  group_vibe     INTEGER NOT NULL CHECK (group_vibe     BETWEEN 1 AND 5),
  overall        NUMERIC(3,2) GENERATED ALWAYS AS (
    (agenda_quality + host_warmth + food_accuracy + group_vibe) / 4.0
  ) STORED,

  comment        TEXT,
  is_visible     BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, reviewer_id)
);

CREATE INDEX idx_reviews_event_id ON public.reviews(event_id);
CREATE INDEX idx_reviews_host_id  ON public.reviews(host_id);

-- Trigger: update event avg ratings after review
CREATE OR REPLACE FUNCTION public.update_event_ratings()
RETURNS TRIGGER AS $$
DECLARE ev_id UUID;
BEGIN
  ev_id := COALESCE(NEW.event_id, OLD.event_id);
  UPDATE public.events
  SET
    avg_agenda_quality = (SELECT AVG(agenda_quality) FROM public.reviews WHERE event_id = ev_id AND is_visible),
    avg_host_warmth    = (SELECT AVG(host_warmth)    FROM public.reviews WHERE event_id = ev_id AND is_visible),
    avg_food_accuracy  = (SELECT AVG(food_accuracy)  FROM public.reviews WHERE event_id = ev_id AND is_visible),
    avg_group_vibe     = (SELECT AVG(group_vibe)     FROM public.reviews WHERE event_id = ev_id AND is_visible),
    avg_overall        = (SELECT AVG(overall)        FROM public.reviews WHERE event_id = ev_id AND is_visible),
    review_count       = (SELECT COUNT(*)            FROM public.reviews WHERE event_id = ev_id AND is_visible)
  WHERE id = ev_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_event_ratings
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_event_ratings();

-- ─────────────────────────────────────────────
-- AGENDA PACKS
-- ─────────────────────────────────────────────
CREATE TABLE public.agenda_packs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  series_name   TEXT NOT NULL,
  description   TEXT,
  topic_tags    TEXT[]  DEFAULT '{}',
  session_count INTEGER DEFAULT 0,
  is_published  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,   -- booking_confirmed, event_reminder, event_cancelled, review_received, etc.
  title      TEXT NOT NULL,
  message    TEXT,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- ─────────────────────────────────────────────
-- DISPUTES
-- ─────────────────────────────────────────────
CREATE TABLE public.disputes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID REFERENCES public.events(id),
  raised_by   UUID NOT NULL REFERENCES public.profiles(id),
  against     UUID REFERENCES public.profiles(id),
  type        TEXT DEFAULT 'general' CHECK (type IN ('refund','safety','conduct','no_show','other','general')),
  description TEXT NOT NULL,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','dismissed')),
  resolution  TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,   -- user_suspended, event_removed, host_verified, escrow_released, etc.
  target_type TEXT,            -- user, event, booking, review
  target_id   UUID,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin_id ON public.audit_logs(admin_id);

-- ─────────────────────────────────────────────
-- HOST FOLLOWS
-- ─────────────────────────────────────────────
CREATE TABLE public.host_follows (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, host_id)
);

-- ─────────────────────────────────────────────
-- SIMULATED ESCROW
-- ─────────────────────────────────────────────
CREATE TABLE public.escrow_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_id     UUID NOT NULL REFERENCES public.events(id),
  guest_id     UUID NOT NULL REFERENCES public.profiles(id),
  host_id      UUID NOT NULL REFERENCES public.profiles(id),
  amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT DEFAULT 'held' CHECK (status IN ('held','released','refunded')),
  released_at  TIMESTAMPTZ,
  refunded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_packs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_follows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_records    ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- PROFILES RLS
CREATE POLICY "profiles: public read"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles: own insert"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: own update"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: admin all"    ON public.profiles USING (get_my_role() = 'admin');

-- EVENTS RLS
CREATE POLICY "events: public read approved/live" ON public.events FOR SELECT
  USING (status IN ('approved','live','completed') OR host_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "events: host insert" ON public.events FOR INSERT
  WITH CHECK (
    host_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('host','admin'))
  );

CREATE POLICY "events: host update own" ON public.events FOR UPDATE
  USING (host_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- BOOKINGS RLS
CREATE POLICY "bookings: own read" ON public.bookings FOR SELECT
  USING (
    guest_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "bookings: guest insert" ON public.bookings FOR INSERT
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "bookings: own update" ON public.bookings FOR UPDATE
  USING (
    guest_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- REVIEWS RLS
CREATE POLICY "reviews: public read" ON public.reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "reviews: own insert"  ON public.reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews: admin all"   ON public.reviews USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- NOTIFICATIONS RLS
CREATE POLICY "notifications: own" ON public.notifications USING (user_id = auth.uid());

-- DISPUTES RLS
CREATE POLICY "disputes: own read" ON public.disputes FOR SELECT
  USING (raised_by = auth.uid() OR against = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "disputes: authenticated insert" ON public.disputes FOR INSERT WITH CHECK (raised_by = auth.uid());

-- AUDIT LOGS RLS (admin only)
CREATE POLICY "audit_logs: admin only" ON public.audit_logs USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- COMMUNITIES RLS
CREATE POLICY "communities: public read" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities: authenticated insert" ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_members: own" ON public.community_members USING (user_id = auth.uid());
CREATE POLICY "community_members: public read" ON public.community_members FOR SELECT USING (true);

-- HOST FOLLOWS RLS
CREATE POLICY "host_follows: own" ON public.host_follows USING (follower_id = auth.uid());
CREATE POLICY "host_follows: public read" ON public.host_follows FOR SELECT USING (true);

-- ESCROW RLS (admin + involved parties)
CREATE POLICY "escrow: involved read" ON public.escrow_records FOR SELECT
  USING (guest_id = auth.uid() OR host_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────
-- SEED: Create admin user helper (run separately after signup)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ─────────────────────────────────────────────
