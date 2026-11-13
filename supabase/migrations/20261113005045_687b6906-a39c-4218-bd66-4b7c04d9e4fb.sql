DROP POLICY IF EXISTS component_alternatives_auth_insert ON public.component_alternatives;
DROP POLICY IF EXISTS component_alternatives_auth_update ON public.component_alternatives;
DROP POLICY IF EXISTS component_alternatives_auth_delete ON public.component_alternatives;
REVOKE INSERT, UPDATE, DELETE ON public.component_alternatives FROM authenticated;