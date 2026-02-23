-- ============================================================================
-- profile_share_keys
--
-- Lets a profile owner generate semi-secret share links that grant elevated
-- resonance visibility to anyone who visits /u/:username?key=<token>.
--
-- Access levels
--   matches  → viewer sees everything a matched user would see
--   express  → viewer sees everything (same as an approved express request)
--
-- The key is validated inside get_resonance() (SECURITY DEFINER), so the
-- profile_share_keys table itself never needs a public SELECT policy.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profile_share_keys table
-- ----------------------------------------------------------------------------

CREATE TABLE public.profile_share_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL UNIQUE,
  label       TEXT,                              -- human-readable name, e.g. "Close friends link"
  grants      TEXT        NOT NULL DEFAULT 'matches'
                          CHECK (grants IN ('matches', 'express')),
  expires_at  TIMESTAMPTZ,                       -- NULL = never expires
  use_count   INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup inside the RPC (profile_id + key)
CREATE INDEX profile_share_keys_lookup_idx
  ON public.profile_share_keys (profile_id, key);

-- RLS: only the profile owner can read / manage their own keys
ALTER TABLE public.profile_share_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage their share keys"
  ON public.profile_share_keys
  FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Comments
COMMENT ON TABLE  public.profile_share_keys IS
  'Semi-secret share tokens that grant a visitor elevated resonance visibility '
  'without requiring them to be authenticated or matched.';

COMMENT ON COLUMN public.profile_share_keys.key IS
  'The opaque token embedded in the share URL (?key=<value>). '
  'Should be generated client-side as a crypto-random string (≥16 chars).';

COMMENT ON COLUMN public.profile_share_keys.grants IS
  '"matches" → visitor sees match-level content; '
  '"express" → visitor sees everything (full express access).';

-- ----------------------------------------------------------------------------
-- 2. Replace get_resonance(UUID, UUID) with get_resonance(UUID, UUID, TEXT)
--
-- We must DROP the old 2-arg signature first because PostgreSQL does not allow
-- CREATE OR REPLACE to change a function's parameter list.
-- The 1-arg convenience overload is updated below and stays callable.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_resonance(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_resonance(
  target_id  UUID,
  viewer_id  UUID  DEFAULT NULL,   -- NULL → anonymous / unauthenticated
  share_key  TEXT  DEFAULT NULL    -- optional semi-secret share token
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_data          JSONB;
  section_vis       JSONB;
  relationship      TEXT;          -- 'public' | 'match' | 'express'
  has_express       BOOLEAN;
  is_match          BOOLEAN;
  share_grant       TEXT;          -- 'matches' | 'express' | NULL
  result            JSONB;
  section_key       TEXT;
  section_vis_level TEXT;
  known_sections    TEXT[] := ARRAY[
    'aura', 'aesthetics', 'aliases', 'persona', 'archetypes',
    'cognitiveStyle', 'values', 'qualities', 'introspections',
    'loops', 'lessons', 'growthVectors', 'languages', 'kinks',
    'activationVectors', 'repulsionVectors', 'flirtInterface',
    'trustSignals', 'distrustSignals', 'consumer', 'glossary',
    'content', 'seeking', 'reciprocityModel', 'conflictStyle',
    'economic', 'viability', 'safety', 'connection', 'discovery',
    'getToKnowMe',
    'attraction', 'engagement', 'powerDynamics', 'playPreferences',
    'repulsion',
    'meta', 'profile'
  ];
  section_key_map   JSONB := '{
    "gtky":        ["getToKnowMe"],
    "aura":        ["aura", "aesthetics", "aliases", "persona"],
    "core":        ["activationVectors", "repulsionVectors", "flirtInterface"],
    "signals":     ["trustSignals", "distrustSignals", "consumer"],
    "qualities":   ["qualities", "introspections", "values"],
    "loops":       ["loops"],
    "lessons":     ["lessons"],
    "languages":   ["languages"],
    "kinks":       ["kinks"],
    "archetypes":  ["archetypes"],
    "attraction":  ["attraction"],
    "engagement":  ["engagement"],
    "dynamics":    ["powerDynamics", "playPreferences"],
    "repulsion":   ["repulsion"],
    "viability":   ["viability", "reciprocityModel", "conflictStyle", "growthVectors"],
    "seeking":     ["seeking"],
    "safety":      ["safety"],
    "economic":    ["economic"],
    "connection":  ["connection"],
    "content":     ["content"],
    "glossary":    ["glossary"],
    "discovery":   ["discovery"]
  }';
BEGIN
  -- ── 1. Fetch raw resonance_data ─────────────────────────────────────────
  SELECT resonance_data
    INTO raw_data
    FROM public.profiles
   WHERE id = target_id;

  IF raw_data IS NULL THEN
    RETURN NULL;
  END IF;

  -- Owner always gets everything
  IF viewer_id IS NOT NULL AND viewer_id = target_id THEN
    RETURN raw_data;
  END IF;

  -- ── 2. Determine base relationship ───────────────────────────────────────
  relationship := 'public';

  IF viewer_id IS NOT NULL THEN
    -- Check for approved express access
    SELECT EXISTS (
      SELECT 1 FROM public.resonance_access_requests
       WHERE requester_id = viewer_id
         AND target_id    = get_resonance.target_id
         AND status       = 'approved'
    ) INTO has_express;

    IF has_express THEN
      relationship := 'express';
    ELSE
      -- Check for match
      SELECT EXISTS (
        SELECT 1 FROM public.matches
         WHERE (user1_id = viewer_id AND user2_id = get_resonance.target_id)
            OR (user2_id = viewer_id AND user1_id = get_resonance.target_id)
      ) INTO is_match;

      IF is_match THEN
        relationship := 'match';
      END IF;
    END IF;
  END IF;

  -- ── 3. Elevate via share key (if not already express) ───────────────────
  IF share_key IS NOT NULL AND relationship <> 'express' THEN
    SELECT grants INTO share_grant
      FROM public.profile_share_keys
     WHERE profile_share_keys.profile_id = get_resonance.target_id
       AND profile_share_keys.key        = get_resonance.share_key
       AND (expires_at IS NULL OR expires_at > now());

    IF share_grant IS NOT NULL THEN
      -- Increment use count (best-effort; ignore failures)
      BEGIN
        UPDATE public.profile_share_keys
           SET use_count = use_count + 1
         WHERE profile_share_keys.profile_id = get_resonance.target_id
           AND profile_share_keys.key        = get_resonance.share_key;
      EXCEPTION WHEN OTHERS THEN
        -- non-fatal
        NULL;
      END;

      -- Elevate relationship
      IF share_grant = 'express' THEN
        relationship := 'express';
      ELSIF share_grant = 'matches' AND relationship = 'public' THEN
        relationship := 'match';
      END IF;
    END IF;
  END IF;

  -- Express sees everything
  IF relationship = 'express' THEN
    RETURN raw_data;
  END IF;

  -- ── 4. Read sectionVisibility ────────────────────────────────────────────
  section_vis := COALESCE(raw_data -> 'sectionVisibility', '{}'::JSONB);

  -- ── 5. Build filtered result ─────────────────────────────────────────────
  result := jsonb_build_object(
    'meta',    raw_data -> 'meta',
    'profile', raw_data -> 'profile'
  );

  FOR section_key IN SELECT * FROM jsonb_object_keys(section_key_map) LOOP
    section_vis_level := COALESCE(
      section_vis ->> section_key,
      'matches'
    );

    IF section_vis_level = 'public'
       OR (section_vis_level = 'matches' AND relationship IN ('match', 'express'))
       OR (section_vis_level = 'express' AND relationship = 'express')
    THEN
      DECLARE
        key_list  JSONB := section_key_map -> section_key;
        data_key  TEXT;
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
$$;

GRANT EXECUTE ON FUNCTION public.get_resonance(UUID, UUID, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Update the 1-arg convenience overload to call the new 3-arg signature
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_resonance(target_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_resonance(target_id, auth.uid(), NULL);
$$;

GRANT EXECUTE ON FUNCTION public.get_resonance(UUID) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------

COMMENT ON FUNCTION public.get_resonance(UUID, UUID, TEXT) IS
  'Returns resonance_data for target_id filtered by the viewer''s effective '
  'relationship (public / match / express).  Relationship is determined by '
  'auth state, match/express records, and optionally a semi-secret share_key '
  'from profile_share_keys.  All sections the viewer cannot see are stripped '
  'server-side.';

COMMENT ON FUNCTION public.get_resonance(UUID) IS
  'Convenience overload: viewer_id defaults to auth.uid(), share_key is NULL. '
  'Authenticated callers can call this without explicit parameters.';
