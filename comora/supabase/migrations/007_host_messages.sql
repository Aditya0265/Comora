-- Migration 007: Guest-to-Host messaging
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.host_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  guest_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.host_messages ENABLE ROW LEVEL SECURITY;

-- Guest can send messages
CREATE POLICY "host_messages: guest insert" ON public.host_messages
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

-- Guest can read their own sent messages
CREATE POLICY "host_messages: guest read own" ON public.host_messages
  FOR SELECT USING (auth.uid() = guest_id);

-- Host can read messages sent to them
CREATE POLICY "host_messages: host read" ON public.host_messages
  FOR SELECT USING (auth.uid() = host_id);

-- Host can mark messages as read
CREATE POLICY "host_messages: host update" ON public.host_messages
  FOR UPDATE USING (auth.uid() = host_id);

DO $$ BEGIN RAISE NOTICE 'Migration 007 applied: host_messages table created.'; END $$;
