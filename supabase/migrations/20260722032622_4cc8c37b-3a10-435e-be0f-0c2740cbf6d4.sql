
-- 1. Age validation trigger on profiles (18-120)
CREATE OR REPLACE FUNCTION public.validate_profile_age()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.age IS NOT NULL AND (NEW.age < 18 OR NEW.age > 120) THEN
    RAISE EXCEPTION 'Age must be between 18 and 120';
  END IF;
  IF NEW.age_min IS NOT NULL AND (NEW.age_min < 18 OR NEW.age_min > 120) THEN
    RAISE EXCEPTION 'age_min must be between 18 and 120';
  END IF;
  IF NEW.age_max IS NOT NULL AND (NEW.age_max < 18 OR NEW.age_max > 120) THEN
    RAISE EXCEPTION 'age_max must be between 18 and 120';
  END IF;
  IF NEW.age_min IS NOT NULL AND NEW.age_max IS NOT NULL AND NEW.age_min > NEW.age_max THEN
    RAISE EXCEPTION 'age_min cannot exceed age_max';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_age_trigger ON public.profiles;
CREATE TRIGGER validate_profile_age_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_age();

-- 2. Anonymous missed-connections privacy view
-- Nulls author_id when is_anonymous=true, except for the author themselves.
CREATE OR REPLACE VIEW public.missed_connections_public
WITH (security_invoker = true)
AS
SELECT
  id,
  CASE
    WHEN is_anonymous AND author_id <> auth.uid() THEN NULL
    ELSE author_id
  END AS author_id,
  category,
  title,
  location_text,
  city,
  encounter_time,
  description,
  looking_for,
  is_anonymous,
  created_at,
  updated_at
FROM public.missed_connections;

GRANT SELECT ON public.missed_connections_public TO anon, authenticated;
