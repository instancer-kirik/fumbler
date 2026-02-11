
-- Add fumble-specific columns to profiles (no photos here)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Separate table for dating photos (potentially explicit, not on main profile)
CREATE TABLE public.fumble_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fumble_photos ENABLE ROW LEVEL SECURITY;

-- Users can manage their own photos
CREATE POLICY "Users can view own photos" ON public.fumble_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON public.fumble_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON public.fumble_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON public.fumble_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Other users can see photos only if not blocked
CREATE POLICY "Users can view others photos if not blocked" ON public.fumble_photos
  FOR SELECT USING (
    user_id != auth.uid() 
    AND public.users_can_see_each_other(auth.uid(), user_id)
  );

-- Index for fast lookups
CREATE INDEX idx_fumble_photos_user_id ON public.fumble_photos(user_id, display_order);
