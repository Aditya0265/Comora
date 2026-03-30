-- ============================================================
-- COMORA — Migration 003: Backend Fixes
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FIX 1: Sync community member_count when members join/leave
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_community_member_count()
RETURNS TRIGGER AS $$
DECLARE v_community_id UUID;
BEGIN
  v_community_id := COALESCE(NEW.community_id, OLD.community_id);
  UPDATE public.communities
  SET member_count = (
    SELECT COUNT(*) FROM public.community_members
    WHERE community_id = v_community_id
  )
  WHERE id = v_community_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_member_count ON public.community_members;
CREATE TRIGGER sync_member_count
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_count();

-- ─────────────────────────────────────────────────────────────
-- FIX 2: Explicit community_members INSERT policy
-- (in some Postgres versions, USING-only policies on INSERT are ambiguous)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "community_members: authenticated insert" ON public.community_members;
CREATE POLICY "community_members: authenticated insert" ON public.community_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- FIX 3: communities INSERT — allow authenticated users to create communities
-- (hosts and admins only — the host application flow promotes a guest to host)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "communities: host insert" ON public.communities;
CREATE POLICY "communities: host insert" ON public.communities
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('host', 'admin'))
  );

-- Replace overly-permissive authenticated insert
DROP POLICY IF EXISTS "communities: authenticated insert" ON public.communities;

-- ─────────────────────────────────────────────────────────────
-- FIX 4: communities UPDATE — allow creator to update their own community
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "communities: creator update" ON public.communities;
CREATE POLICY "communities: creator update" ON public.communities
  FOR UPDATE USING (created_by = auth.uid() OR get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- FIX 5: bookings — allow hosts to see bookings for their events
-- (already covered by existing policy, but ensure it's explicit)
-- ─────────────────────────────────────────────────────────────
-- The existing "bookings: own read" policy covers this. No change needed.

-- ─────────────────────────────────────────────────────────────
-- FIX 6: profiles — ensure the updated_at trigger fires on preference updates
-- This was already in migration 001 but ensure it's applied.
-- ─────────────────────────────────────────────────────────────
-- Already handled by profiles_updated_at trigger. No change needed.

-- ─────────────────────────────────────────────────────────────
-- FIX 7: Add min_guests column to events table (missing from 001)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS min_guests INTEGER DEFAULT 4;

-- ─────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN RAISE NOTICE 'Migration 003 applied successfully.'; END $$;
