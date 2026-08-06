ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;