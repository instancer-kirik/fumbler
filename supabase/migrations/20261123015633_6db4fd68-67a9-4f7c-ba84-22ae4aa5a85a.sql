CREATE INDEX fumble_help_requests_requester_id_created_at_idx
ON public.fumble_help_requests (requester_id, created_at DESC);

CREATE INDEX fumble_help_requests_status_created_at_idx
ON public.fumble_help_requests (status, created_at DESC);