CREATE TABLE public.fumble_help_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.fumble_help_requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fumble_help_messages TO authenticated;
GRANT ALL ON public.fumble_help_messages TO service_role;

ALTER TABLE public.fumble_help_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters and help team can view help messages"
ON public.fumble_help_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fumble_help_requests request
    WHERE request.id = request_id
      AND (
        request.requester_id = auth.uid()
        OR public.has_role('admin'::public.user_role, auth.uid())
        OR public.has_role('moderator'::public.user_role, auth.uid())
      )
  )
);

CREATE POLICY "Requesters and help team can add help messages"
ON public.fumble_help_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.fumble_help_requests request
    WHERE request.id = request_id
      AND (
        request.requester_id = auth.uid()
        OR public.has_role('admin'::public.user_role, auth.uid())
        OR public.has_role('moderator'::public.user_role, auth.uid())
      )
  )
);

CREATE INDEX fumble_help_messages_request_created_idx
ON public.fumble_help_messages (request_id, created_at);

CREATE INDEX fumble_help_messages_author_idx
ON public.fumble_help_messages (author_id);