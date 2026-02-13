
-- Add missing columns to matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
ADD COLUMN IF NOT EXISTS scheduled_date timestamptz,
ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS contact_shared_by_user1 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_shared_by_user2 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add contact_methods to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS contact_methods jsonb DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches (user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches (user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches (status);

-- Update policy (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'Users can update own matches'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Users can update own matches"
      ON public.matches
      FOR UPDATE TO authenticated
      USING (user1_id = auth.uid() OR user2_id = auth.uid())
      WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid())
    $sql$;
  END IF;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
