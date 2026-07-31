CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  handle TEXT,
  avatar_url TEXT,
  link_url TEXT,
  intents TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'not_reached',
  priority TEXT NOT NULL DEFAULT 'medium',
  next_action TEXT,
  next_action_due DATE,
  contact_channel TEXT,
  contact_value TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  last_touched_at TIMESTAMPTZ,
  reveal_to_person BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.people_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  kind TEXT NOT NULL DEFAULT 'note',
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX people_owner_idx ON public.people(owner_id);
CREATE INDEX people_interactions_person_idx ON public.people_interactions(person_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT ALL ON public.people TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_interactions TO authenticated;
GRANT ALL ON public.people_interactions TO service_role;

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their people" ON public.people
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Revealed entries visible to the listed person" ON public.people
  FOR SELECT TO authenticated
  USING (reveal_to_person = true AND profile_id = auth.uid());

CREATE POLICY "Owners manage their interactions" ON public.people_interactions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();