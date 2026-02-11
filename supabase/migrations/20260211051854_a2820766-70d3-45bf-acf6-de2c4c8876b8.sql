-- Fix swipes SELECT policy: allow users to also read swipes directed at them (needed for mutual match detection)
DROP POLICY "Users can read own swipes" ON public.swipes;
CREATE POLICY "Users can read relevant swipes"
  ON public.swipes FOR SELECT
  USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);