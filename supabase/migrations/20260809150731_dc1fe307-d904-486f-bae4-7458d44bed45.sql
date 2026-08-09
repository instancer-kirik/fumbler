CREATE OR REPLACE FUNCTION public.get_resonance(target_id uuid, viewer_id uuid DEFAULT NULL::uuid, share_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  raw_data          JSONB;
  section_vis       JSONB;
  relationship      TEXT;
  has_express       BOOLEAN;
  is_match          BOOLEAN;
  share_grant       TEXT;
  result            JSONB;
  section_key       TEXT;
  section_vis_level TEXT;
  section_key_map   JSONB := '{
    "gtky":          ["getToKnowMe"],
    "faveth":        ["faveth"],
    "skills":        ["skills"],
    "aura":          ["aura", "aesthetics", "aliases", "persona"],
    "core":          ["activationVectors", "repulsionVectors", "flirtInterface", "cognitiveStyle"],
    "signals":       ["trustSignals", "distrustSignals", "consumer"],
    "qualities":     ["qualities", "introspections", "values"],
    "loops":         ["loops"],
    "lessons":       ["lessons"],
    "aspirations":   ["aspirations"],
    "dreamlog":      ["sleepingDreams"],
    "languages":     ["languages"],
    "kinks":         ["kinks", "desires"],
    "archetypes":    ["archetypes"],
    "frames":        ["frames"],
    "attraction":    ["attraction"],
    "engagement":    ["engagement"],
    "dynamics":      ["powerDynamics", "playPreferences"],
    "repulsion":     ["repulsion", "repulsionVectors"],
    "viability":     ["viability", "reciprocityModel", "conflictStyle", "growthVectors"],
    "seeking":       ["seeking"],
    "offering":      ["offering"],
    "collaborations":["collaborations"],
    "sizing":        ["sizing"],
    "safety":        ["safety"],
    "economic":      ["economic"],
    "connection":    ["connection"],
    "content":       ["content"],
    "glossary":      ["glossary"],
    "discovery":     ["discovery"]
  }';
BEGIN
  SELECT resonance_data INTO raw_data FROM public.profiles WHERE id = target_id;
  IF raw_data IS NULL THEN RETURN NULL; END IF;
  IF viewer_id IS NOT NULL AND viewer_id = target_id THEN RETURN raw_data; END IF;

  relationship := 'public';
  IF viewer_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.resonance_access_requests
       WHERE requester_id = viewer_id AND target_id = get_resonance.target_id AND status = 'approved')
      INTO has_express;
    IF has_express THEN
      relationship := 'express';
    ELSE
      SELECT EXISTS (SELECT 1 FROM public.matches
         WHERE (user1_id = viewer_id AND user2_id = get_resonance.target_id)
            OR (user2_id = viewer_id AND user1_id = get_resonance.target_id))
        INTO is_match;
      IF is_match THEN relationship := 'match'; END IF;
    END IF;
  END IF;

  IF share_key IS NOT NULL AND relationship <> 'express' THEN
    SELECT grants INTO share_grant
      FROM public.profile_share_keys
     WHERE profile_share_keys.profile_id = get_resonance.target_id
       AND profile_share_keys.key = get_resonance.share_key
       AND (expires_at IS NULL OR expires_at > now());
    IF share_grant IS NOT NULL THEN
      BEGIN
        UPDATE public.profile_share_keys SET use_count = use_count + 1
         WHERE profile_share_keys.profile_id = get_resonance.target_id
           AND profile_share_keys.key = get_resonance.share_key;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      IF share_grant = 'express' THEN relationship := 'express';
      ELSIF share_grant = 'matches' AND relationship = 'public' THEN relationship := 'match';
      END IF;
    END IF;
  END IF;

  IF relationship = 'express' THEN RETURN raw_data; END IF;

  section_vis := COALESCE(raw_data -> 'sectionVisibility', '{}'::JSONB);
  result := jsonb_build_object(
    'meta', raw_data -> 'meta',
    'profile', raw_data -> 'profile',
    'sectionVisibility', section_vis
  );

  FOR section_key IN SELECT * FROM jsonb_object_keys(section_key_map) LOOP
    section_vis_level := COALESCE(section_vis ->> section_key,
      CASE WHEN section_key IN ('sizing', 'frames') THEN 'express' ELSE 'matches' END);
    IF section_vis_level = 'public'
       OR (section_vis_level = 'matches' AND relationship IN ('match', 'express'))
       OR (section_vis_level = 'express' AND relationship = 'express')
    THEN
      DECLARE
        key_list JSONB := section_key_map -> section_key;
        data_key TEXT;
      BEGIN
        FOR data_key IN SELECT jsonb_array_elements_text(key_list) LOOP
          IF raw_data ? data_key THEN
            result := result || jsonb_build_object(data_key, raw_data -> data_key);
          END IF;
        END LOOP;
      END;
    END IF;
  END LOOP;

  RETURN result;
END;
$function$;