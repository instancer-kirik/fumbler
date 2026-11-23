CREATE OR REPLACE FUNCTION public.apply_fumble_meetup_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE ALL ON FUNCTION public.apply_fumble_meetup_capacity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_fumble_meetup_capacity() FROM anon;
REVOKE ALL ON FUNCTION public.apply_fumble_meetup_capacity() FROM authenticated;