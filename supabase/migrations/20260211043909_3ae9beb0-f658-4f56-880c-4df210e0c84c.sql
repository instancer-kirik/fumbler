
-- Enum for field visibility levels
CREATE TYPE public.field_visibility AS ENUM ('public', 'matches', 'express');

-- Per-user default visibility for each resonance field
CREATE TABLE public.resonance_field_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  visibility field_visibility NOT NULL DEFAULT 'matches',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, field_key)
);

-- Per-user grants for express-only fields
CREATE TABLE public.resonance_field_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, viewer_id, field_key)
);

-- Indexes
CREATE INDEX idx_rfv_user ON public.resonance_field_visibility(user_id);
CREATE INDEX idx_rfg_owner ON public.resonance_field_grants(owner_id);
CREATE INDEX idx_rfg_viewer ON public.resonance_field_grants(viewer_id);

-- RLS
ALTER TABLE public.resonance_field_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resonance_field_grants ENABLE ROW LEVEL SECURITY;

-- Users manage their own visibility settings
CREATE POLICY "Users manage own field visibility"
  ON public.resonance_field_visibility FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Others can read visibility settings (to know what's public/requestable)
CREATE POLICY "Authenticated users can read field visibility"
  ON public.resonance_field_visibility FOR SELECT
  TO authenticated
  USING (true);

-- Owners manage their grants
CREATE POLICY "Owners manage grants"
  ON public.resonance_field_grants FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Viewers can see grants addressed to them
CREATE POLICY "Viewers can see their grants"
  ON public.resonance_field_grants FOR SELECT
  USING (auth.uid() = viewer_id);

-- Viewers can insert requests (pending grants)
CREATE POLICY "Viewers can request access"
  ON public.resonance_field_grants FOR INSERT
  WITH CHECK (auth.uid() = viewer_id AND status = 'pending');

-- Timestamp triggers
CREATE TRIGGER update_rfv_updated_at
  BEFORE UPDATE ON public.resonance_field_visibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfg_updated_at
  BEFORE UPDATE ON public.resonance_field_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
