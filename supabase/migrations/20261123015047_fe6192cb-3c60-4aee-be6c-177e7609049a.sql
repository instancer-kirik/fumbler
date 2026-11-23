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
  LEFT JOIN public.profiles p ON p.id = m.host_id
  WHERE m.host_id = auth.uid()
    OR (m.status = 'published' AND public.users_can_see_each_other(auth.uid(), m.host_id))
  ORDER BY m.starts_at ASC;
$$;