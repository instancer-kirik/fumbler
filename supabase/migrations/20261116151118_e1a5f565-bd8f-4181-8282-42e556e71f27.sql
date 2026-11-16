GRANT SELECT ON public.aesthetic_boards TO anon;
GRANT SELECT ON public.aesthetic_pins TO anon;

CREATE POLICY "Anyone can view public Goal Style boards" ON public.aesthetic_boards FOR SELECT TO anon, authenticated USING (visibility = 'public');
CREATE POLICY "Matches can view matches-only Goal Style boards" ON public.aesthetic_boards FOR SELECT TO authenticated USING (
  visibility = 'matches'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.user1_id = user_id AND m.user2_id = auth.uid())
       OR (m.user2_id = user_id AND m.user1_id = auth.uid())
  )
);
CREATE POLICY "Anyone can view public Goal Style pins" ON public.aesthetic_pins FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.visibility = 'public')
);
CREATE POLICY "Matches can view matches-only Goal Style pins" ON public.aesthetic_pins FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.aesthetic_boards b
    WHERE b.id = board_id
      AND b.visibility = 'matches'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE (m.user1_id = b.user_id AND m.user2_id = auth.uid())
           OR (m.user2_id = b.user_id AND m.user1_id = auth.uid())
      )
  )
);

CREATE OR REPLACE FUNCTION public.get_goal_style_board(target_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  board_record public.aesthetic_boards%ROWTYPE;
BEGIN
  SELECT * INTO board_record FROM public.aesthetic_boards WHERE user_id = target_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN (
    SELECT jsonb_build_object(
      'visibility', board_record.visibility,
      'pins', COALESCE(jsonb_agg(
        jsonb_build_object('aestheticSlug', p.aesthetic_slug, 'note', p.note)
        ORDER BY p.position, p.created_at
      ) FILTER (WHERE p.id IS NOT NULL), '[]'::jsonb)
    )
    FROM public.aesthetic_pins p
    WHERE p.board_id = board_record.id
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_goal_style_board(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_goal_style_board(UUID) TO anon, authenticated;