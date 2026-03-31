-- Migration 009: Threaded conversation replies for host_messages
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.message_replies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id  UUID NOT NULL REFERENCES public.host_messages(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- Guest can reply in their own threads
CREATE POLICY "message_replies: guest insert" ON public.message_replies
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.host_messages WHERE id = thread_id AND guest_id = auth.uid())
  );

-- Host can reply in their threads
CREATE POLICY "message_replies: host insert" ON public.message_replies
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.host_messages WHERE id = thread_id AND host_id = auth.uid())
  );

-- Both guest and host can read replies in their threads
CREATE POLICY "message_replies: read" ON public.message_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.host_messages
      WHERE id = thread_id AND (guest_id = auth.uid() OR host_id = auth.uid())
    )
  );

DO $$ BEGIN RAISE NOTICE 'Migration 009 applied: message_replies table created.'; END $$;
