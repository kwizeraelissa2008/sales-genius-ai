
CREATE TYPE public.sequence_step_status AS ENUM ('pending','sent','skipped','failed');

CREATE TABLE public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  scheduled_at timestamptz NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status public.sequence_step_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_sequences_user_lead_idx ON public.email_sequences(user_id, lead_id);
CREATE INDEX email_sequences_scheduled_idx ON public.email_sequences(scheduled_at) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sequences TO authenticated;
GRANT ALL ON public.email_sequences TO service_role;

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sequences all" ON public.email_sequences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
