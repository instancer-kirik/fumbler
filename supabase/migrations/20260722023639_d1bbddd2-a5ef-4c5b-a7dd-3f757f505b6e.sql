
-- Convert existing scalar gender text into an array column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender_new text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_description text;

UPDATE public.profiles
  SET gender_new = ARRAY[gender]
  WHERE gender IS NOT NULL AND gender <> '' AND (gender_new = '{}' OR gender_new IS NULL);

ALTER TABLE public.profiles DROP COLUMN IF EXISTS gender;
ALTER TABLE public.profiles RENAME COLUMN gender_new TO gender;
