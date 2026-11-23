CREATE TABLE public.fumble_help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('technical', 'account', 'safety', 'connection', 'other')),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 2000),
  page_path text NOT NULL DEFAULT '' CHECK (char_length(page_path) <= 500),
  allow_contact boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fumble_help_requests TO authenticated;
GRANT ALL ON public.fumble_help_requests TO service_role;

ALTER TABLE public.fumble_help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own help requests and help team can review"
ON public.fumble_help_requests
FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR public.has_role('admin'::public.user_role, auth.uid())
  OR public.has_role('moderator'::public.user_role, auth.uid())
);

CREATE POLICY "Users can create own help requests"
ON public.fumble_help_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND status = 'new'
);

CREATE POLICY "Help team can update help requests"
ON public.fumble_help_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role('admin'::public.user_role, auth.uid())
  OR public.has_role('moderator'::public.user_role, auth.uid())
)
WITH CHECK (
  public.has_role('admin'::public.user_role, auth.uid())
  OR public.has_role('moderator'::public.user_role, auth.uid())
);

CREATE POLICY "Users can delete own help requests"
ON public.fumble_help_requests
FOR DELETE
TO authenticated
USING (requester_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_fumble_help_request_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_fumble_help_request_updated_at
BEFORE UPDATE ON public.fumble_help_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_fumble_help_request_updated_at();

REVOKE ALL ON FUNCTION public.set_fumble_help_request_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_fumble_help_request_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_fumble_help_request_updated_at() FROM authenticated;