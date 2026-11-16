ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS is_discoverable boolean NOT NULL DEFAULT false;

UPDATE public.artists AS a
SET owner_id = ownership.owner_id
FROM (
  SELECT DISTINCT ON (content_id) content_id, owner_id
  FROM public.content_ownership
  WHERE content_type = 'artist'::public.content_type
  ORDER BY content_id, created_at
) AS ownership
WHERE a.id = ownership.content_id
  AND a.owner_id IS NULL;

CREATE INDEX IF NOT EXISTS artists_owner_id_idx ON public.artists(owner_id);
CREATE INDEX IF NOT EXISTS artists_discoverable_idx ON public.artists(is_discoverable) WHERE is_discoverable = true;

GRANT SELECT ON public.artists TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT ALL ON public.artists TO service_role;

CREATE POLICY "Members can create their own artist profiles"
ON public.artists FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their artist profiles"
ON public.artists FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_content_owner(id, 'artist'::public.content_type, auth.uid())
)
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_content_owner(id, 'artist'::public.content_type, auth.uid())
);

CREATE POLICY "Owners can delete their artist profiles"
ON public.artists FOR DELETE TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_content_owner(id, 'artist'::public.content_type, auth.uid())
);

CREATE OR REPLACE FUNCTION public.protect_artist_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
    AND auth.uid() IS NOT NULL
    AND NOT public.has_role('admin'::public.user_role, auth.uid()) THEN
    RAISE EXCEPTION 'Artist ownership cannot be transferred directly';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_artist_owner_before_update
BEFORE UPDATE ON public.artists
FOR EACH ROW EXECUTE FUNCTION public.protect_artist_owner();

CREATE TABLE public.artist_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  description text,
  url text NOT NULL,
  storage_path text,
  mime_type text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT artist_media_kind_check CHECK (kind IN ('audio', 'image'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_media TO authenticated;
GRANT ALL ON public.artist_media TO service_role;
ALTER TABLE public.artist_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view permitted artist media"
ON public.artist_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_id
      AND (
        a.is_discoverable = true
        OR a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE POLICY "Owners can add artist media"
ON public.artist_media FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_id
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE POLICY "Owners can edit artist media"
ON public.artist_media FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_id
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_id
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE POLICY "Owners can remove artist media"
ON public.artist_media FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_id
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE INDEX artist_media_artist_position_idx ON public.artist_media(artist_id, position, created_at);
CREATE TRIGGER update_artist_media_updated_at
BEFORE UPDATE ON public.artist_media
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, DELETE ON public.user_artist_relationships TO authenticated;
GRANT ALL ON public.user_artist_relationships TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS user_artist_follow_unique_idx
ON public.user_artist_relationships(user_id, artist_id)
WHERE role = 'follow';

CREATE POLICY "Members can view their artist follows"
ON public.user_artist_relationships FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Members can follow artists"
ON public.user_artist_relationships FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'follow');

CREATE POLICY "Members can unfollow artists"
ON public.user_artist_relationships FOR DELETE TO authenticated
USING (user_id = auth.uid() AND role = 'follow');

CREATE OR REPLACE FUNCTION public.artist_id_from_media_path(object_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, storage
AS $$
BEGIN
  RETURN (storage.foldername(object_name))[1]::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.artist_id_from_media_path(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.artist_id_from_media_path(text) TO authenticated, service_role;

CREATE POLICY "Members can preview permitted artist uploads"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'artist-media'
  AND EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = public.artist_id_from_media_path(name)
      AND (
        a.is_discoverable = true
        OR a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE POLICY "Owners can upload artist media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'artist-media'
  AND EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = public.artist_id_from_media_path(name)
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE POLICY "Owners can replace artist media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'artist-media'
  AND EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = public.artist_id_from_media_path(name)
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
)
WITH CHECK (
  bucket_id = 'artist-media'
  AND EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = public.artist_id_from_media_path(name)
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);

CREATE POLICY "Owners can delete artist uploads"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'artist-media'
  AND EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = public.artist_id_from_media_path(name)
      AND (
        a.owner_id = auth.uid()
        OR public.is_content_owner(a.id, 'artist'::public.content_type, auth.uid())
      )
  )
);