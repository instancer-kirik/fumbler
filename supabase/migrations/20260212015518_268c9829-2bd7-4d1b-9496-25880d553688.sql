
-- Table for requesting access to "express" visibility sections
CREATE TABLE public.resonance_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id, section_id)
);

ALTER TABLE public.resonance_access_requests ENABLE ROW LEVEL SECURITY;

-- Requester can see their own requests
CREATE POLICY "Users can view their own requests"
  ON public.resonance_access_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON public.resonance_access_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Target user can update (approve/deny)
CREATE POLICY "Target can respond to requests"
  ON public.resonance_access_requests FOR UPDATE
  USING (auth.uid() = target_id);

-- Requester can delete their own pending requests
CREATE POLICY "Requester can cancel pending requests"
  ON public.resonance_access_requests FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

CREATE TRIGGER update_resonance_access_requests_updated_at
  BEFORE UPDATE ON public.resonance_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
