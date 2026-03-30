-- Migration 006: Fix Supabase Storage RLS for avatars bucket
-- Run this in Supabase Dashboard → SQL Editor

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "avatars: public read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars: own upload"    ON storage.objects;
DROP POLICY IF EXISTS "avatars: own update"    ON storage.objects;
DROP POLICY IF EXISTS "avatars: own delete"    ON storage.objects;

-- Anyone can read avatars (public bucket)
CREATE POLICY "avatars: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload into their own folder (path starts with their user id)
CREATE POLICY "avatars: own upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatars
CREATE POLICY "avatars: own update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatars
CREATE POLICY "avatars: own delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DO $$ BEGIN RAISE NOTICE 'Migration 006 applied: avatars storage policies set.'; END $$;
