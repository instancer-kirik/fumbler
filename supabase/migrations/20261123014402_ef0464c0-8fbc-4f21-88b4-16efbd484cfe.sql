CREATE TABLE public.fumble_meetups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Activity',
  description text NOT NULL DEFAULT '',
  location_name text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  capacity integer,
  status text NOT NULL DEFAULT 'published',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fumble_meetups_title_length CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  CONSTRAINT fumble_meetups_location_length CHECK (char_length(btrim(location_name)) BETWEEN 2 AND 160),
  CONSTRAINT fumble_meetups_capacity_valid CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 100),
  CONSTRAINT fumble_meetups_status_valid CHECK (status IN ('published', 'cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fumble_meetups TO authenticated;
GRANT ALL ON public.fumble_meetups TO service_role;
ALTER TABLE public.fumble_meetups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view visible Fumbler meetups"
ON public.fumble_meetups FOR SELECT TO authenticated
USING (
  host_id = auth.uid()
  OR (status = 'published' AND public.users_can_see_each_other(auth.uid(), host_id))
);
CREATE POLICY "Users can host their own Fumbler meetups"
ON public.fumble_meetups FOR INSERT TO authenticated
WITH CHECK (host_id = auth.uid());
CREATE POLICY "Hosts can update their own Fumbler meetups"
ON public.fumble_meetups FOR UPDATE TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());
CREATE POLICY "Hosts can delete their own Fumbler meetups"
ON public.fumble_meetups FOR DELETE TO authenticated
USING (host_id = auth.uid());

CREATE TABLE public.fumble_meetup_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meetup_id uuid NOT NULL REFERENCES public.fumble_meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fumble_meetup_rsvps_unique_person UNIQUE (meetup_id, user_id),
  CONSTRAINT fumble_meetup_rsvps_status_valid CHECK (status IN ('going', 'interested', 'waitlist'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fumble_meetup_rsvps TO authenticated;
GRANT ALL ON public.fumble_meetup_rsvps TO service_role;
ALTER TABLE public.fumble_meetup_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users and hosts can view relevant Fumbler RSVPs"
ON public.fumble_meetup_rsvps FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.fumble_meetups m
    WHERE m.id = meetup_id AND m.host_id = auth.uid()
  )
);
CREATE POLICY "Users can respond to visible Fumbler meetups"
ON public.fumble_meetup_rsvps FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.fumble_meetups m
    WHERE m.id = meetup_id
      AND m.host_id <> auth.uid()
      AND m.status = 'published'
      AND public.users_can_see_each_other(auth.uid(), m.host_id)
  )
);
CREATE POLICY "Users can update their own Fumbler RSVP"
ON public.fumble_meetup_rsvps FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.fumble_meetups m
    WHERE m.id = meetup_id
      AND m.host_id <> auth.uid()
      AND m.status = 'published'
      AND public.users_can_see_each_other(auth.uid(), m.host_id)
  )
);
CREATE POLICY "Users can withdraw their own Fumbler RSVP"
ON public.fumble_meetup_rsvps FOR DELETE TO authenticated
USING (user_id = auth.uid());

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
  IF TG_OP = 'UPDATE' AND NEW.capacity IS NOT NULL AND NEW.capacity < (
    SELECT count(*) FROM public.fumble_meetup_rsvps
    WHERE meetup_id = NEW.id AND status = 'going'
  ) THEN
    RAISE EXCEPTION 'Guest limit cannot be lower than the current going count';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_fumble_meetup_details
BEFORE INSERT OR UPDATE ON public.fumble_meetups
FOR EACH ROW EXECUTE FUNCTION public.validate_fumble_meetup();
CREATE TRIGGER update_fumble_meetups_updated_at
BEFORE UPDATE ON public.fumble_meetups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE TRIGGER apply_fumble_meetup_capacity
BEFORE INSERT OR UPDATE ON public.fumble_meetup_rsvps
FOR EACH ROW EXECUTE FUNCTION public.apply_fumble_meetup_capacity();
CREATE TRIGGER update_fumble_meetup_rsvps_updated_at
BEFORE UPDATE ON public.fumble_meetup_rsvps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id, m.host_id, m.title, m.category, m.description, m.location_name,
    m.starts_at, m.ends_at, m.capacity, m.status, m.created_at, m.updated_at,
    p.full_name, p.username, p.avatar_url,
    (SELECT count(*) FROM public.fumble_meetup_rsvps r
      WHERE r.meetup_id = m.id AND r.status = 'going') AS going_count,
    (SELECT count(*) FROM public.fumble_meetup_rsvps r
      WHERE r.meetup_id = m.id AND r.status = 'interested') AS interested_count,
    (SELECT r.status FROM public.fumble_meetup_rsvps r
      WHERE r.meetup_id = m.id AND r.user_id = auth.uid() LIMIT 1) AS viewer_status
  FROM public.fumble_meetups m
  JOIN public.profiles p ON p.id = m.host_id
  WHERE m.host_id = auth.uid()
    OR (m.status = 'published' AND public.users_can_see_each_other(auth.uid(), m.host_id))
  ORDER BY m.starts_at ASC;
$$;
REVOKE ALL ON FUNCTION public.get_fumble_meetups() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_fumble_meetups() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_fumble_meetups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fumble_meetups() TO service_role;

CREATE INDEX fumble_meetups_upcoming_idx ON public.fumble_meetups (status, starts_at);
CREATE INDEX fumble_meetup_rsvps_meetup_status_idx ON public.fumble_meetup_rsvps (meetup_id, status);
CREATE INDEX fumble_meetup_rsvps_user_idx ON public.fumble_meetup_rsvps (user_id);