DROP POLICY "Users can create artists" ON public.artists;
DROP POLICY "Users can update their own artists" ON public.artists;
DROP POLICY "Users can delete their own artists" ON public.artists;

DROP POLICY "Members can create their own artist profiles" ON public.artists;
CREATE POLICY "Members can create their own artist profiles"
ON public.artists FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  OR public.has_role('admin'::public.user_role, auth.uid())
);
