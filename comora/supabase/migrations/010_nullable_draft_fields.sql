-- Allow draft events to be saved with partial data.
-- title, description, agenda_type, and date_time are required for published
-- events but may legitimately be absent while a host is mid-flow in HostStudio.
-- App-level validation in validateStep() still enforces them before submission.

ALTER TABLE public.events
  ALTER COLUMN title       DROP NOT NULL,
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN agenda_type DROP NOT NULL,
  ALTER COLUMN date_time   DROP NOT NULL;
