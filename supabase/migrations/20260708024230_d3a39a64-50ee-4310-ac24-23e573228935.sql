DROP FUNCTION IF EXISTS public.get_public_identity(text);

CREATE OR REPLACE FUNCTION public.get_public_identity(_username text)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  age integer,
  is_public boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, full_name, avatar_url, age, is_public
  FROM public.profiles
  WHERE username = _username
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_identity(text) TO anon, authenticated;