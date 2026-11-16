DROP POLICY "Members can view their own Goal Style board" ON public.aesthetic_boards;
DROP POLICY "Anyone can view public Goal Style boards" ON public.aesthetic_boards;
DROP POLICY "Matches can view matches-only Goal Style boards" ON public.aesthetic_boards;
CREATE POLICY "Anyone can view public Goal Style boards" ON public.aesthetic_boards FOR SELECT TO anon USING (visibility = 'public');
CREATE POLICY "Members can view permitted Goal Style boards" ON public.aesthetic_boards FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR visibility = 'public'
  OR (
    visibility = 'matches'
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user1_id = user_id AND m.user2_id = auth.uid())
         OR (m.user2_id = user_id AND m.user1_id = auth.uid())
    )
  )
);

DROP POLICY "Members can view their own Goal Style pins" ON public.aesthetic_pins;
DROP POLICY "Anyone can view public Goal Style pins" ON public.aesthetic_pins;
DROP POLICY "Matches can view matches-only Goal Style pins" ON public.aesthetic_pins;
CREATE POLICY "Anyone can view public Goal Style pins" ON public.aesthetic_pins FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.visibility = 'public')
);
CREATE POLICY "Members can view permitted Goal Style pins" ON public.aesthetic_pins FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.aesthetic_boards b
    WHERE b.id = board_id
      AND (
        b.user_id = auth.uid()
        OR b.visibility = 'public'
        OR (
          b.visibility = 'matches'
          AND EXISTS (
            SELECT 1 FROM public.matches m
            WHERE (m.user1_id = b.user_id AND m.user2_id = auth.uid())
               OR (m.user2_id = b.user_id AND m.user1_id = auth.uid())
          )
        )
      )
  )
);