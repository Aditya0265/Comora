-- ============================================================
-- COMORA — Seed: Communities
-- Run this in Supabase SQL Editor AFTER at least one user has
-- signed up (the seed uses the first profile as the creator).
-- ============================================================

DO $$
DECLARE v_host UUID;
BEGIN
  -- Use the first existing profile as seed creator
  SELECT id INTO v_host FROM public.profiles LIMIT 1;

  IF v_host IS NULL THEN
    RAISE NOTICE 'No profiles found. Sign up first, then re-run this seed.';
    RETURN;
  END IF;

  INSERT INTO public.communities (id, name, description, topic_tags, city, member_count, created_by)
  VALUES
    (
      'c1000000-0000-0000-0000-000000000001',
      'Hyderabad Book Circle',
      'One book, one city, one conversation at a time. We discuss literary fiction, contemporary Indian writing, and translated classics.',
      ARRAY['Literature'],
      'Hyderabad',
      412,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000002',
      'Applied Ethics in AI',
      'Where philosophy meets machine learning. We explore the ethical dimensions of AI systems and their impact on society.',
      ARRAY['Philosophy'],
      'Bangalore',
      289,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000003',
      'Bengaluru Film Collective',
      'Cinema as a lens for understanding the world. Kubrick retrospectives, world cinema, and post-screening discussions.',
      ARRAY['Film'],
      'Bangalore',
      534,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000004',
      'Mumbai Design & UX Guild',
      'Designers who critique, learn, and build together. Portfolio reviews, case studies, and weekly design challenges.',
      ARRAY['Technology'],
      'Mumbai',
      318,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000005',
      'Indie Music Explorers',
      'Sharing rare records and unheard artists. Listening sessions, Carnatic jazz fusion, and genre deep-dives.',
      ARRAY['Music'],
      'Chennai',
      196,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000006',
      'Science & Society Forum',
      'Because science doesn''t happen in a vacuum. Bioethics panels, climate discussions, and public health debates.',
      ARRAY['Science'],
      'Pune',
      241,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000007',
      'Early Career Collective',
      'Real talk about work, growth, and ambition. Salary negotiation, job hunting, and career navigation for professionals under 30.',
      ARRAY['Career'],
      'Bangalore',
      603,
      v_host
    ),
    (
      'c1000000-0000-0000-0000-000000000008',
      'Philosophy of Mind Circle',
      'Consciousness, free will, and the hard problem. Reading Nagel, Chalmers, Dennett — and asking what it means to be.',
      ARRAY['Philosophy'],
      'Hyderabad',
      178,
      v_host
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seeded 8 communities successfully.';
END;
$$;
