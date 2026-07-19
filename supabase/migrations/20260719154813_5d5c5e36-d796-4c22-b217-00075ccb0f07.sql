-- Allow anyone to see photos of publicly-visible profiles (for /u/:username)
CREATE POLICY "Anyone can view photos of public profiles"
ON public.fumble_photos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = fumble_photos.user_id AND p.is_public = true
  )
);

GRANT SELECT ON public.fumble_photos TO anon;