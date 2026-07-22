
-- Category enum
DO $$ BEGIN
  CREATE TYPE public.missed_connection_category AS ENUM ('romantic','friendly','platonic','funny','collab','lost_found');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.missed_connection_reaction_kind AS ENUM ('relate','thats_me');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Posts
CREATE TABLE public.missed_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.missed_connection_category NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  location_text TEXT NOT NULL CHECK (char_length(location_text) BETWEEN 1 AND 200),
  city TEXT CHECK (city IS NULL OR char_length(city) <= 80),
  encounter_time TEXT CHECK (encounter_time IS NULL OR char_length(encounter_time) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  looking_for TEXT CHECK (looking_for IS NULL OR char_length(looking_for) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.missed_connections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missed_connections TO authenticated;
GRANT ALL ON public.missed_connections TO service_role;

ALTER TABLE public.missed_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Missed connections are readable by all"
  ON public.missed_connections FOR SELECT
  USING (true);

CREATE POLICY "Signed-in users can post missed connections"
  ON public.missed_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their missed connections"
  ON public.missed_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their missed connections"
  ON public.missed_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE INDEX idx_missed_connections_created_at ON public.missed_connections (created_at DESC);
CREATE INDEX idx_missed_connections_category ON public.missed_connections (category);
CREATE INDEX idx_missed_connections_city ON public.missed_connections (city);
CREATE INDEX idx_missed_connections_author ON public.missed_connections (author_id);

CREATE TRIGGER trg_missed_connections_updated
  BEFORE UPDATE ON public.missed_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reactions
CREATE TABLE public.missed_connection_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  missed_connection_id UUID NOT NULL REFERENCES public.missed_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.missed_connection_reaction_kind NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (missed_connection_id, user_id, kind)
);

GRANT SELECT, INSERT, DELETE ON public.missed_connection_reactions TO authenticated;
GRANT ALL ON public.missed_connection_reactions TO service_role;

ALTER TABLE public.missed_connection_reactions ENABLE ROW LEVEL SECURITY;

-- Relate reactions are visible to all authenticated users; "thats_me" only visible to the reactor and the post author
CREATE POLICY "Relate reactions readable by authenticated"
  ON public.missed_connection_reactions FOR SELECT
  TO authenticated
  USING (
    kind = 'relate'
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.missed_connections mc
      WHERE mc.id = missed_connection_id AND mc.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can react as themselves"
  ON public.missed_connection_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.missed_connections mc
      WHERE mc.id = missed_connection_id AND mc.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON public.missed_connection_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_mc_reactions_mc ON public.missed_connection_reactions (missed_connection_id);
CREATE INDEX idx_mc_reactions_user ON public.missed_connection_reactions (user_id);
