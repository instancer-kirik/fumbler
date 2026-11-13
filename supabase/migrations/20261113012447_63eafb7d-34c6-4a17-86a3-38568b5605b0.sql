DO $do$
DECLARE r record; oc text; cond text;
  triv text := '^\(*\s*(true|auth\.uid\(\) IS NOT NULL|auth\.role\(\) = ''authenticated''::text)\s*\)*$';
BEGIN
  FOR r IN SELECT p.tablename t, p.policyname n, p.cmd c, p.roles::text[] rl, p.qual q, p.with_check w
    FROM pg_policies p
    WHERE p.schemaname='public' AND p.cmd <> 'SELECT'
      AND p.tablename NOT IN ('waitlist','commit_activity','feedback','creator_survey_responses')
      AND p.tablename IN ('artists','brands','communities','component_installation_quotes','component_installment_options','component_maintenance_schedules','component_status_history','events','ingredients','loreum_character_abilities','loreum_character_instances','loreum_characters','loreum_civilizations','loreum_culture_instances','loreum_enchantments','loreum_governments','loreum_instance_usage_tracking','loreum_ipsumarium_templates','loreum_item_enchantments','loreum_item_instances','loreum_items','loreum_lore_nodes','loreum_magic_abilities','loreum_magic_progression_rules','loreum_magic_system_instances','loreum_magic_systems','loreum_multiverses','loreum_powers','loreum_regions','loreum_species','loreum_species_instances','loreum_star_systems','loreum_tech_trees','loreum_technology_instances','loreum_template_analytics','loreum_template_instance_relationships','loreum_template_instances','loreum_timelines','loreum_universes','loreum_worlds','pockets_bumpers','pockets_channels','pockets_episodes','pockets_playlists','pockets_rotation_logs','pockets_tracks','pockets_yt_bookmarks','posts','product_options','product_variants','products','project_aspect_tags','project_competitors','project_decision_criteria','project_decision_options','project_decision_scores','project_design_axes','project_design_configs','project_design_options','project_images','project_inventory_items','project_share_variants','project_tasks','projects','radio_channels','radio_tracks','resources','snack_alcoholic','snack_ratings','snack_smokeables','snack_spicy','vehicle_components','venues','video_scenes','video_scripts','video_shots','words')
  LOOP
    IF coalesce(r.q,'true') ~* triv AND coalesce(r.w,'true') ~* triv THEN
      oc := NULL;
      SELECT column_name INTO oc FROM information_schema.columns
        WHERE table_schema='public' AND table_name=r.t
          AND column_name IN ('user_id','created_by','owner_id','author_id','creator_id','uploaded_by','rater_id','profile_id')
        ORDER BY array_position(ARRAY['user_id','created_by','owner_id','author_id','creator_id','uploaded_by','rater_id','profile_id'], column_name::text) LIMIT 1;
      IF oc IS NOT NULL THEN
        cond := format('(%I::text = auth.uid()::text OR public.has_role(''admin''::user_role, auth.uid()))', oc);
      ELSE
        cond := '(public.has_role(''admin''::user_role, auth.uid()))';
      END IF;
    ELSIF r.c IN ('UPDATE','ALL') AND coalesce(r.w,'true') ~* triv AND r.q IS NOT NULL THEN
      cond := '(' || r.q || ')';
      EXECUTE format('ALTER POLICY %I ON public.%I USING %s WITH CHECK %s', r.n, r.t, cond, cond);
      CONTINUE;
    ELSE
      CONTINUE;
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