CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position int NOT NULL DEFAULT 0,
  framework text NOT NULL DEFAULT 'general',
  prompt text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz questions readable" ON public.quiz_questions FOR SELECT USING (active);
CREATE POLICY "Admins manage quiz questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role('admin'::user_role, auth.uid())) WITH CHECK (public.has_role('admin'::user_role, auth.uid()));

CREATE TABLE public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  label text NOT NULL,
  effects jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_options_question_idx ON public.quiz_options(question_id);
GRANT SELECT ON public.quiz_options TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz options readable" ON public.quiz_options FOR SELECT USING (true);
CREATE POLICY "Admins manage quiz options" ON public.quiz_options FOR ALL TO authenticated
  USING (public.has_role('admin'::user_role, auth.uid())) WITH CHECK (public.has_role('admin'::user_role, auth.uid()));

CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.quiz_results TO authenticated;
GRANT ALL ON public.quiz_results TO service_role;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own quiz results read" ON public.quiz_results FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own quiz results insert" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own quiz results delete" ON public.quiz_results FOR DELETE TO authenticated USING (user_id = auth.uid());