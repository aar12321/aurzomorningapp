-- ============================================================
-- Aurzo Ecosystem: User Profiles + Subscription Management
-- ============================================================

-- Extended user profile for Aurzo ecosystem
-- (separate from legacy quiz app "users" table)
CREATE TABLE IF NOT EXISTS public.aurzo_user_profiles (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  display_name    TEXT,
  avatar_url      TEXT,
  -- Onboarding data
  goals           TEXT[]      DEFAULT '{}',
  interests       TEXT[]      DEFAULT '{}',
  referral_source TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step      INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Subscription table for Aurzo platform access
CREATE TABLE IF NOT EXISTS public.aurzo_subscriptions (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'premium' = all platforms, 'individual' = selected platforms, 'none' = no active sub
  plan_type         TEXT        NOT NULL DEFAULT 'none'
                    CHECK (plan_type IN ('premium', 'individual', 'none')),
  -- Array of platform IDs the user has access to
  -- Known platform IDs: 'morning-growth-loop', 'aurzo-finance', 'aurzo-morning', 'aurzo-wellness'
  platforms         TEXT[]      NOT NULL DEFAULT '{}',
  -- 'active', 'cancelled', 'paused'
  status            TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'paused')),
  price_monthly     NUMERIC(10,2) NOT NULL DEFAULT 0,
  next_billing_date DATE,
  cancelled_at      TIMESTAMPTZ,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ---- Row Level Security ----
ALTER TABLE public.aurzo_user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aurzo_subscriptions  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/insert/update their own row
CREATE POLICY "aurzo_profiles_select"
  ON public.aurzo_user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "aurzo_profiles_insert"
  ON public.aurzo_user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "aurzo_profiles_update"
  ON public.aurzo_user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscriptions: users can read/insert/update their own row
CREATE POLICY "aurzo_subs_select"
  ON public.aurzo_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "aurzo_subs_insert"
  ON public.aurzo_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "aurzo_subs_update"
  ON public.aurzo_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- Auto-create profile on new Supabase auth user ----
CREATE OR REPLACE FUNCTION public.handle_aurzo_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.aurzo_user_profiles (user_id, full_name, avatar_url, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists, then re-create
DROP TRIGGER IF EXISTS on_aurzo_auth_user_created ON auth.users;
CREATE TRIGGER on_aurzo_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_aurzo_new_user();

-- ---- Helper: updated_at trigger ----
CREATE OR REPLACE FUNCTION public.aurzo_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER aurzo_profiles_updated_at
  BEFORE UPDATE ON public.aurzo_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.aurzo_set_updated_at();

CREATE TRIGGER aurzo_subs_updated_at
  BEFORE UPDATE ON public.aurzo_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.aurzo_set_updated_at();
