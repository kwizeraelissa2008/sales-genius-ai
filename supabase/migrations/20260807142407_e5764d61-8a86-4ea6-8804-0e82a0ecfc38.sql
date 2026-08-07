CREATE TYPE public.usage_kind AS ENUM ('ai_email', 'enrichment', 'email_send');

CREATE TABLE public.usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.usage_kind NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own usage select" ON public.usage_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own usage insert" ON public.usage_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX usage_events_user_kind_created_idx
  ON public.usage_events (user_id, kind, created_at DESC);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;