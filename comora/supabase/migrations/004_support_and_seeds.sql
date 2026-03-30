-- ============================================================
-- COMORA — Migration 004: Support Tickets + Seed Events
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. SUPPORT TICKETS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  category    TEXT DEFAULT 'general' CHECK (category IN ('general','account','booking','host','safety','other')),
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  admin_reply TEXT,
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets: own read" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "support_tickets: anyone insert" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "support_tickets: admin update" ON public.support_tickets
  FOR UPDATE USING (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 2. ADD MISSING COLUMNS TO EVENTS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS min_guests INTEGER DEFAULT 4;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);

-- ─────────────────────────────────────────────────────────────
-- 3. SEED EVENTS
-- Run AFTER you have at least one host profile in the DB.
-- Replace the host_id below with your actual host UUID, OR
-- let it auto-pick the first host/admin profile.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_host UUID;
  v_community_lit  UUID := 'c1000000-0000-0000-0000-000000000001';
  v_community_ai   UUID := 'c1000000-0000-0000-0000-000000000002';
  v_community_film UUID := 'c1000000-0000-0000-0000-000000000003';
  v_community_tech UUID := 'c1000000-0000-0000-0000-000000000004';
  v_community_philo UUID := 'c1000000-0000-0000-0000-000000000008';
BEGIN
  -- Pick the first user with role host or admin
  SELECT id INTO v_host
  FROM public.profiles
  WHERE role IN ('host', 'admin')
  ORDER BY created_at
  LIMIT 1;

  IF v_host IS NULL THEN
    RAISE NOTICE 'No host/admin profile found. Apply to become a host first, then re-run this seed.';
    RETURN;
  END IF;

  INSERT INTO public.events (
    id, host_id, title, description, agenda_type, topic_tags,
    vibe_structure, vibe_energy, vibe_expertise,
    date_time, duration_minutes,
    venue_type, venue_name, venue_city,
    max_guests, min_guests, current_guests, price,
    cancellation_policy, registration_mode, dietary_options,
    status, community_id
  )
  VALUES
    (
      'e1000000-0000-0000-0000-000000000001',
      v_host,
      'Late Night Philosophy Over Coffee',
      'We read three chapters of Camus'' "The Myth of Sisyphus" and spend 2 hours interrogating whether absurdism is a practical life philosophy or an intellectual escape hatch. Come ready to argue. No prep required — just curiosity and an open mind.',
      'discussion',
      ARRAY['Philosophy', 'Existentialism', 'Critical Thinking'],
      2, 3, 2,
      NOW() + INTERVAL '5 days',
      120,
      'cafe', 'The Reading Room, Banjara Hills', 'Hyderabad',
      8, 4, 0, 0,
      '24h', 'open', ARRAY['Vegan', 'Vegetarian'],
      'approved', v_community_philo
    ),
    (
      'e1000000-0000-0000-0000-000000000002',
      v_host,
      'Book Club: "The God of Small Things"',
      'Arundhati Roy''s Booker Prize winner dissected in an intimate group. We''ll focus on the class and caste dynamics, Roy''s prose style, and the ending that nobody can stop thinking about. Read at least the first half before you come.',
      'book_club',
      ARRAY['Literature', 'Indian Writing', 'Postcolonialism'],
      4, 2, 3,
      NOW() + INTERVAL '8 days',
      150,
      'home', 'Host''s apartment (address shared on RSVP)', 'Hyderabad',
      6, 4, 0, 0,
      '48h', 'request', ARRAY['Vegetarian'],
      'approved', v_community_lit
    ),
    (
      'e1000000-0000-0000-0000-000000000003',
      v_host,
      'AI Ethics Debate: Who Owns the Output?',
      'Is AI-generated art really art? Who owns the copyright — the model, the prompter, or nobody? We''ll do a structured debate: two sides, 45 minutes each, then open floor. Works well even if you don''t have a strong opinion walking in.',
      'debate',
      ARRAY['AI', 'Ethics', 'Philosophy', 'Technology'],
      5, 4, 4,
      NOW() + INTERVAL '10 days',
      180,
      'cafe', 'Brew Lab, Jubilee Hills', 'Hyderabad',
      10, 6, 0, 150,
      '24h', 'open', ARRAY['Vegan', 'Vegetarian', 'Gluten-free'],
      'approved', v_community_ai
    ),
    (
      'e1000000-0000-0000-0000-000000000004',
      v_host,
      'Film Screening: "Stalker" (Tarkovsky, 1979)',
      'A 160-minute Soviet science fiction meditation on faith, desire, and the unknowable. We watch together, then spend an hour breaking down what the Zone actually means. First-time watchers welcome — no prior Tarkovsky required.',
      'screening',
      ARRAY['Film Studies', 'Soviet Cinema', 'Existentialism'],
      3, 2, 2,
      NOW() + INTERVAL '12 days',
      240,
      'home', 'Host''s home theatre (Madhapur)', 'Hyderabad',
      8, 5, 0, 200,
      '72h', 'request', ARRAY['Vegetarian'],
      'approved', v_community_film
    ),
    (
      'e1000000-0000-0000-0000-000000000005',
      v_host,
      'Build in Public: Side Project Showcase',
      'Five builders share their side projects — 5 minutes each, then 10 minutes of feedback from the group. Anything counts: apps, research, art, weird experiments. The only rule: you must have actually built something. Audience is encouraged to be helpful, not just kind.',
      'networking',
      ARRAY['Technology', 'Product', 'Entrepreneurship', 'Design'],
      3, 4, 3,
      NOW() + INTERVAL '14 days',
      120,
      'cafe', 'The CoWork Café, Kondapur', 'Hyderabad',
      12, 6, 0, 100,
      '24h', 'open', ARRAY['Vegan', 'Vegetarian'],
      'approved', v_community_tech
    ),
    (
      'e1000000-0000-0000-0000-000000000006',
      v_host,
      'Storytelling Circle: First Jobs & Worst Bosses',
      'No prep required. Show up, pick a prompt from the jar, and tell us a true story from your work life — funny, embarrassing, or formative. We keep it confidential. Great for anyone who has been wondering if their job experience is normal.',
      'storytelling',
      ARRAY['Career', 'Personal Stories', 'Work Culture'],
      2, 4, 1,
      NOW() + INTERVAL '18 days',
      120,
      'cafe', 'Aromas Café, Jubilee Hills', 'Hyderabad',
      8, 4, 0, 0,
      'none', 'open', ARRAY['Vegan', 'Vegetarian', 'Non-vegetarian'],
      'approved', NULL
    ),
    (
      'e1000000-0000-0000-0000-000000000007',
      v_host,
      'Writing Workshop: The First Paragraph Problem',
      'Every writer gets stuck at the beginning. We workshop three opening paragraphs from participants (submit yours in advance), and break down what makes a first paragraph actually work — using examples from Nabokov to Oyeyemi.',
      'workshop',
      ARRAY['Writing', 'Literature', 'Craft'],
      4, 3, 3,
      NOW() + INTERVAL '20 days',
      150,
      'home', 'Host''s apartment (Banjara Hills)', 'Hyderabad',
      7, 4, 0, 250,
      '48h', 'request', ARRAY['Vegetarian'],
      'approved', v_community_lit
    ),
    (
      'e1000000-0000-0000-0000-000000000008',
      v_host,
      'Science Café: Consciousness and the Hard Problem',
      'Why does subjective experience exist at all? We dig into David Chalmers'' hard problem — guided by a neuroscience grad student — and ask whether it can ever be answered by science alone, or whether it''s a philosophical dead end.',
      'discussion',
      ARRAY['Neuroscience', 'Philosophy', 'Consciousness'],
      3, 3, 3,
      NOW() + INTERVAL '22 days',
      120,
      'cafe', 'Qissa Khwani, Madhapur', 'Hyderabad',
      8, 4, 0, 0,
      '24h', 'open', ARRAY['Vegan', 'Vegetarian'],
      'approved', v_community_philo
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seeded 8 events successfully (host: %).', v_host;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN RAISE NOTICE 'Migration 004 applied successfully.'; END $$;
