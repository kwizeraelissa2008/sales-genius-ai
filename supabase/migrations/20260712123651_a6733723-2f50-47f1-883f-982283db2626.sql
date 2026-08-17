
-- Company profile (one per user)
CREATE TABLE public.company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  website text,
  description text,
  product_name text,
  product_description text,
  key_features text[] NOT NULL DEFAULT '{}',
  price_range text,
  value_proposition text,
  target_industries text[] NOT NULL DEFAULT '{}',
  company_sizes text[] NOT NULL DEFAULT '{}',
  target_titles text[] NOT NULL DEFAULT '{}',
  pain_points text,
  regions text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profiles TO authenticated;
GRANT ALL ON public.company_profiles TO service_role;

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own company profile" ON public.company_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pipeline stages
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'replied';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'meeting';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'proposal';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'won';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'lost';

-- Deal value for pipeline totals / ROI
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_value numeric NOT NULL DEFAULT 0;
