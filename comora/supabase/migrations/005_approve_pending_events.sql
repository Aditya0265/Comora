-- Migration 005: Approve pending host events so they appear on Browse
-- Sets all host-submitted events (status='pending') to 'live'
-- This is equivalent to admin approving them

UPDATE public.events
SET status = 'live'
WHERE status = 'pending';

-- Notify completion
DO $$ BEGIN RAISE NOTICE 'Migration 005 applied: pending events set to live.'; END $$;
