DROP POLICY IF EXISTS "Users can insert matches" ON public.matches;
CREATE POLICY "Users can insert mutual matches" ON public.matches FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user1_id OR auth.uid() = user2_id)
  AND EXISTS (SELECT 1 FROM public.swipes s WHERE s.swiper_id = user1_id AND s.swiped_id = user2_id AND s.direction IN ('right','super'))
  AND EXISTS (SELECT 1 FROM public.swipes s WHERE s.swiper_id = user2_id AND s.swiped_id = user1_id AND s.direction IN ('right','super'))
);

CREATE OR REPLACE FUNCTION public.users_can_see_each_other(user_a uuid, user_b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN auth.uid() IS NULL OR auth.uid() NOT IN (user_a, user_b) THEN NULL
  ELSE NOT EXISTS (SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b) OR (blocker_id = user_b AND blocked_id = user_a)) END
$$;
REVOKE EXECUTE ON FUNCTION public.users_can_see_each_other(uuid,uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.users_can_see_each_other(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_identity(_username text)
RETURNS TABLE(id uuid, username text, full_name text, avatar_url text, age integer, is_public boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.username,
    CASE WHEN p.is_public OR p.id = auth.uid() THEN p.full_name END,
    CASE WHEN p.is_public OR p.id = auth.uid() THEN p.avatar_url END,
    CASE WHEN p.is_public OR p.id = auth.uid() THEN p.age END,
    p.is_public
  FROM public.profiles p WHERE p.username = _username LIMIT 1;
$$;

DROP POLICY IF EXISTS "Authenticated users can upload UGC media" ON storage.objects;
CREATE POLICY "Users upload UGC media to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ugc-media' AND (storage.foldername(name))[1] = (select auth.uid()::text));
DROP POLICY IF EXISTS "project_images_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "project_images_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "project_images_auth_delete" ON storage.objects;
CREATE POLICY "project_images_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "project_images_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-images' AND owner_id = (select auth.uid()::text))
WITH CHECK (bucket_id = 'project-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "project_images_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-images' AND owner_id = (select auth.uid()::text));

DO $do$
DECLARE r record; oc text; cond text;
BEGIN
  FOR r IN SELECT p.tablename t, p.policyname n, p.cmd c, p.roles::text[] rl
    FROM pg_policies p
    WHERE p.schemaname='public' AND p.cmd <> 'SELECT' AND p.tablename NOT IN ('waitlist','commit_activity')
      AND p.policyname IN ('Users can update their own artists','Users can update their own brands','Users can update their own communities','component_installation_quotes_auth_delete','component_installment_options_auth_delete','component_maintenance_schedules_auth_delete','component_status_history_auth_delete','Anyone can submit a survey response','Users can update their own events','Anyone can submit feedback','Authenticated users can create ingredients','Enable delete for authenticated users','authenticated_users_delete_culture_instances','authenticated_users_insert_instance_usage_tracking','authenticated_users_delete_item_instances','authenticated_users_delete_magic_system_instances','authenticated_users_delete_species_instances','authenticated_users_delete_technology_instances','Authenticated users can insert analytics','authenticated_users_delete_template_instance_relationships','authenticated_users_delete_template_instances','Authenticated users can delete bumpers','Authenticated users can delete channels','Authenticated users can delete episodes','Authenticated users can delete playlists','Authenticated users can insert rotation logs','Authenticated users can delete tracks','Authenticated users can delete yt bookmarks','Users can create posts','Authenticated users can manage options','Authenticated users can manage variants','Authenticated users can manage products','Authenticated users can delete aspect tags','Allow authenticated delete for project competitors','Allow authenticated delete for decision criteria','Allow authenticated delete for decision options','Allow authenticated delete for decision scores','Allow authenticated delete for design axes','Allow authenticated delete for design configs','Allow authenticated delete for design options','project_images_auth_write','pii_delete_authenticated','Authenticated can delete share variants','Authenticated users can create project tasks','Users can create projects','Authenticated users can delete radio channels','Authenticated users can delete radio tracks','Users can update their own resources','Authenticated users can insert alcoholic details','Users can create ratings','Authenticated users can insert smokeable details','Authenticated users can insert spicy details','vehicle_components_auth_delete','Users can update their own venues','video_scenes_auth_delete','video_scripts_auth_delete','video_shots_auth_delete','Allow insert for authenticated users')
      AND (coalesce(p.qual,'true') !~* 'auth\.uid\(\)\s*=|=\s*auth\.uid\(\)|has_role|is_content_owner|is_my_content' )
      AND (coalesce(p.with_check,'true') !~* 'auth\.uid\(\)\s*=|=\s*auth\.uid\(\)|has_role|is_content_owner|is_my_content')
  LOOP
    oc := NULL;
    SELECT column_name INTO oc FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.t
        AND column_name IN ('user_id','created_by','owner_id','author_id','creator_id','uploaded_by','rater_id','profile_id')
      ORDER BY array_position(ARRAY['user_id','created_by','owner_id','author_id','creator_id','uploaded_by','rater_id','profile_id'], column_name::text) LIMIT 1;
    IF r.t IN ('feedback','creator_survey_responses') AND oc IS NOT NULL THEN
      cond := format('(%I IS NULL OR %I::text = auth.uid()::text)', oc, oc);
    ELSIF oc IS NOT NULL THEN
      cond := format('(%I::text = auth.uid()::text OR public.has_role(''admin''::user_role, auth.uid()))', oc);
    ELSE
      cond := '(public.has_role(''admin''::user_role, auth.uid()))';
    END IF;
    EXECUTE format('DROP POLICY %I ON public.%I', r.n, r.t);
    IF r.c = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO %s WITH CHECK %s', r.n, r.t, array_to_string(r.rl, ','), cond);
    ELSIF r.c = 'DELETE' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO %s USING %s', r.n, r.t, array_to_string(r.rl, ','), cond);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO %s USING %s WITH CHECK %s', r.n, r.t, r.c, array_to_string(r.rl, ','), cond, cond);
    END IF;
  END LOOP;
END
$do$;