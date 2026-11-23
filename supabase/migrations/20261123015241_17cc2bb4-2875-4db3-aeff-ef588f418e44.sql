CREATE OR REPLACE FUNCTION public.validate_fumble_meetup()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.starts_at <= now() THEN
    RAISE EXCEPTION 'Meetups must start in the future';
  END IF;
  IF NEW.ends_at IS NOT NULL AND NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Meetup end time must be after its start time';
  END IF;
  IF TG_OP = 'INSERT' AND (NEW.going_count <> 0 OR NEW.interested_count <> 0) THEN
    RAISE EXCEPTION 'Attendance totals are maintained from responses';
  END IF;
  IF TG_OP = 'UPDATE' AND current_user IN ('anon', 'authenticated') AND (
    NEW.going_count IS DISTINCT FROM OLD.going_count
    OR NEW.interested_count IS DISTINCT FROM OLD.interested_count
  ) THEN
    RAISE EXCEPTION 'Attendance totals are maintained from responses';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.capacity IS NOT NULL AND NEW.capacity < (
    SELECT count(*) FROM public.fumble_meetup_rsvps
    WHERE meetup_id = NEW.id AND status = 'going'
  ) THEN
    RAISE EXCEPTION 'Guest limit cannot be lower than the current going count';
  END IF;
  RETURN NEW;
END;
$$;