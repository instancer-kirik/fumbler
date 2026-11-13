CREATE TYPE public.aesthetic_category AS ENUM ('fashion', 'spaces', 'art', 'music');
CREATE TYPE public.aesthetic_board_visibility AS ENUM ('private', 'matches', 'public');

CREATE TABLE public.aesthetic_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category public.aesthetic_category NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  related_slugs TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aesthetic_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aesthetic_entries TO authenticated;
GRANT ALL ON public.aesthetic_entries TO service_role;
ALTER TABLE public.aesthetic_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse community aesthetics" ON public.aesthetic_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Members can add their own aesthetics" ON public.aesthetic_entries FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can edit their own aesthetics" ON public.aesthetic_entries FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can remove their own aesthetics" ON public.aesthetic_entries FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE TRIGGER update_aesthetic_entries_updated_at BEFORE UPDATE ON public.aesthetic_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.aesthetic_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  visibility public.aesthetic_board_visibility NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aesthetic_boards TO authenticated;
GRANT ALL ON public.aesthetic_boards TO service_role;
ALTER TABLE public.aesthetic_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their own Goal Style board" ON public.aesthetic_boards FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Members can create their own Goal Style board" ON public.aesthetic_boards FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members can edit their own Goal Style board" ON public.aesthetic_boards FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members can remove their own Goal Style board" ON public.aesthetic_boards FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER update_aesthetic_boards_updated_at BEFORE UPDATE ON public.aesthetic_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.aesthetic_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.aesthetic_boards(id) ON DELETE CASCADE,
  aesthetic_slug TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (board_id, aesthetic_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aesthetic_pins TO authenticated;
GRANT ALL ON public.aesthetic_pins TO service_role;
ALTER TABLE public.aesthetic_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their own Goal Style pins" ON public.aesthetic_pins FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.user_id = auth.uid()));
CREATE POLICY "Members can add their own Goal Style pins" ON public.aesthetic_pins FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.user_id = auth.uid()));
CREATE POLICY "Members can edit their own Goal Style pins" ON public.aesthetic_pins FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.user_id = auth.uid()));
CREATE POLICY "Members can remove their own Goal Style pins" ON public.aesthetic_pins FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.aesthetic_boards b WHERE b.id = board_id AND b.user_id = auth.uid()));
CREATE TRIGGER update_aesthetic_pins_updated_at BEFORE UPDATE ON public.aesthetic_pins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_goal_style_board(target_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  board_record public.aesthetic_boards%ROWTYPE;
  allowed BOOLEAN := false;
BEGIN
  SELECT * INTO board_record FROM public.aesthetic_boards WHERE user_id = target_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  allowed := auth.uid() = target_id
    OR board_record.visibility = 'public'
    OR (
      board_record.visibility = 'matches'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE (m.user1_id = target_id AND m.user2_id = auth.uid())
           OR (m.user2_id = target_id AND m.user1_id = auth.uid())
      )
    );

  IF NOT allowed THEN RETURN NULL; END IF;

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