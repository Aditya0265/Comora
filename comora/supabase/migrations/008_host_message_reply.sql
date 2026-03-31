-- Migration 008: Add reply column to host_messages
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.host_messages
  ADD COLUMN IF NOT EXISTS host_reply  TEXT,
  ADD COLUMN IF NOT EXISTS replied_at  TIMESTAMPTZ;

DO $$ BEGIN RAISE NOTICE 'Migration 008 applied: host_reply column added to host_messages.'; END $$;
