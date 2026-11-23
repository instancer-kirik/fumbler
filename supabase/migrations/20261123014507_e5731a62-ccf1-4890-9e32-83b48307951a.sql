ALTER TABLE public.fumble_meetups
  ADD COLUMN going_count integer NOT NULL DEFAULT 0,
  ADD COLUMN interested_count integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT fumble_meetups_counts_valid CHECK (going_count >= 0 AND interested_count >= 0);

UPDATE public.fumble_meetups m
SET
  going_count = (SELECT count(*) FROM public.fumble_meetup_rsvps r WHERE r.meetup_id = m.id AND r.status = 'going'),
  interested_count = (SELECT count(*) FROM public.fumble_meetup_rsvps r WHERE r.meetup_id = m.id AND r.status = 'interested');

CREATE OR REPLACE FUNCTION public.apply_fumble_meetup_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  meetup_capacity integer;
  meetup_host uuid;
  meetup_status text;
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.meetup_id IS DISTINCT FROM OLD.meetup_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  ) THEN
    RAISE EXCEPTION 'An RSVP cannot be moved to another person or meetup';
  END IF;

  SELECT capacity, host_id, status
  INTO meetup_capacity, meetup_host, meetup_status
  FROM public.fumble_meetups
  WHERE id = NEW.meetup_id
  FOR UPDATE;

  IF NOT FOUND OR meetup_status <> 'published' THEN
    RAISE EXCEPTION 'This meetup is not open for responses';
  END IF;
  IF meetup_host = NEW.user_id THEN
    RAISE EXCEPTION 'Hosts do not need an RSVP to their own meetup';
  END IF;

  IF NEW.status = 'going'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'going')
    AND meetup_capacity IS NOT NULL
    AND (SELECT count(*) FROM public.fumble_meetup_rsvps
         WHERE meetup_id = NEW.meetup_id AND status = 'going') >= meetup_capacity
  THEN
    NEW.status := 'waitlist';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_fumble_meetup_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_meetup_id uuid;
BEGIN
  target_meetup_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.meetup_id ELSE NEW.meetup_id END;
  UPDATE public.fumble_meetups m
  SET
    going_count = (SELECT count(*) FROM public.fumble_meetup_rsvps r WHERE r.meetup_id = m.id AND r.status = 'going'),
    interested_count = (SELECT count(*) FROM public.fumble_meetup_rsvps r WHERE r.meetup_id = m.id AND r.status = 'interested')
  WHERE m.id = target_meetup_id;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_fumble_meetup_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_fumble_meetup_counts() FROM anon;
REVOKE ALL ON FUNCTION public.refresh_fumble_meetup_counts() FROM authenticated;

CREATE TRIGGER refresh_fumble_meetup_counts
AFTER INSERT OR UPDATE OR DELETE ON public.fumble_meetup_rsvps
FOR EACH ROW EXECUTE FUNCTION public.refresh_fumble_meetup_counts();

CREATE OR REPLACE FUNCTION public.get_fumble_meetups()
RETURNS TABLE (
  id uuid,
  host_id uuid,
  title text,
  category text,
  description text,
  location_name text,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  capacity integer,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  host_name text,
  host_username text,
  host_avatar_url text,
  going_count bigint,
  interested_count bigint,
  viewer_status text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    m.id, m.host_id, m.title, m.category, m.description, m.location_name,
    m.starts_at, m.ends_at, m.capacity, m.status, m.created_at, m.updated_at,
    p.full_name, p.username, p.avatar_url,
    m.going_count::bigint AS going_count,
    m.interested_count::bigint AS interested_count,
    (SELECT r.status FROM public.fumble_meetup_rsvps r
      WHERE r.meetup_id = m.id AND r.user_id = auth.uid() LIMIT 1) AS viewer_status
  FROM public.fumble_meetups m
  JOIN public.profiles p ON p.id = m.host_id
  WHERE m.host_id = auth.uid()
    OR (m.status = 'published' AND public.users_can_see_each_other(auth.uid(), m.host_id))
  ORDER BY m.starts_at ASC;
$$;

CREATE INDEX fumble_meetups_host_id_idx ON public.fumble_meetups (host_id);