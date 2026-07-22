
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS orientation text,
  ADD COLUMN IF NOT EXISTS interested_in text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS looking_for text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS age_min integer,
  ADD COLUMN IF NOT EXISTS age_max integer;
