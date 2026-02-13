
-- Allow users to view profiles of people they are matched with
CREATE POLICY "Users can view matched profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.matches
    WHERE (user1_id = auth.uid() AND user2_id = profiles.id)
       OR (user2_id = auth.uid() AND user1_id = profiles.id)
  )
);

-- Allow anyone (including anonymous) to view a profile by username (for public /u/:username pages)
CREATE POLICY "Public profile lookup by username"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  username IS NOT NULL AND username != ''
);
