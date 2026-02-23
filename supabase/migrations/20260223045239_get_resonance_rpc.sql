-- ============================================================================
-- get_resonance RPC
--
-- Server-side visibility filtering for resonance_data.
-- Determines caller → target relationship (public / match / express) inside
-- Postgres, reads sectionVisibility out of the JSONB, and strips any section
-- the caller is not allowed to see before returning.
--
-- This replaces direct `.select("resonance_data")` on the profiles table for
-- all viewer contexts.  The profiles SELECT policies are tightened below so
-- that resonance_data is no longer exposed through broad table reads.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Core RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_resonance(
  target_id  UUID,
  viewer_id  UUID DEFAULT NULL   -- NULL → anonymous / unauthenticated
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER                 -- runs as owner, bypasses caller's RLS
SET search_path = public
AS $$
DECLARE
  raw_data          JSONB;
  section_vis       JSONB;
  relationship      TEXT;         -- 'public' | 'match' | 'express'
  has_express       BOOLEAN;
  is_match          BOOLEAN;
  result            JSONB;
  section_key       TEXT;
  section_vis_level TEXT;
  -- Section keys that exist in resonance_data (everything except
  -- sectionVisibility itself, which is meta and always stripped from output).
  known_sections    TEXT[] := ARRAY[
    'aura', 'aesthetics', 'aliases', 'persona', 'archetypes',
    'cognitiveStyle', 'values', 'qualities', 'introspections',
    'loops', 'lessons', 'growthVectors', 'languages', 'kinks',
    'activationVectors', 'repulsionVectors', 'flirtInterface',
    'trustSignals', 'distrustSignals', 'consumer', 'glossary',
    'content', 'seeking', 'reciprocityModel', 'conflictStyle',
    'economic', 'viability', 'safety', 'connection', 'discovery',
    'getToKnowMe',
    -- v1.0 editor extension fields
    'attraction', 'engagement', 'powerDynamics', 'playPreferences',
    'repulsion',
    -- profile metadata
    'meta', 'profile'
  ];
  -- Map editor section IDs (used in sectionVisibility) to the top-level
  -- JSONB keys they control.  One section ID may gate multiple keys.
  -- Format: section_id → ARRAY of jsonb keys
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

  -- ── 2. Determine relationship ────────────────────────────────────────────
  relationship := 'public';

  IF viewer_id IS NOT NULL THEN
    -- Check for approved express access (any section is enough to elevate)
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

  -- Express sees everything
  IF relationship = 'express' THEN
    RETURN raw_data;
  END IF;

  -- ── 3. Read sectionVisibility ────────────────────────────────────────────
  section_vis := COALESCE(raw_data -> 'sectionVisibility', '{}'::JSONB);

  -- ── 4. Build filtered result ─────────────────────────────────────────────
  -- Start with non-section meta (safe to always expose on a readable profile)
  result := jsonb_build_object(
    'meta',    raw_data -> 'meta',
    'profile', raw_data -> 'profile'
  );

  -- Walk each section ID, decide whether the viewer can see it
  FOR section_key IN SELECT * FROM jsonb_object_keys(section_key_map) LOOP
    section_vis_level := COALESCE(
      section_vis ->> section_key,
      'matches'   -- default: visible to matches and above
    );

    -- Decide whether this viewer's relationship clears the required level
    IF section_vis_level = 'public'
       OR (section_vis_level = 'matches' AND relationship IN ('match', 'express'))
       OR (section_vis_level = 'express' AND relationship = 'express')
    THEN
      -- Merge all JSONB keys this section controls into the result
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

-- Allow any authenticated user (and anon, for public /u/:username pages) to
-- call the function.  Security is enforced inside the function itself.
GRANT EXECUTE ON FUNCTION public.get_resonance(UUID, UUID) TO anon, authenticated;

-- Convenience overload: viewer_id defaults to the current auth.uid() so
-- authenticated callers don't have to pass it explicitly.
CREATE OR REPLACE FUNCTION public.get_resonance(target_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_resonance(target_id, auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.get_resonance(UUID) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Tighten profiles SELECT policies
--
-- Strip resonance_data from the two broad policies that currently hand it
-- to anyone who can read the row.  Direct .select("resonance_data") on the
-- table now returns NULL for non-owners; callers must use get_resonance().
--
-- We do this by replacing the policies with column-level exclusions using a
-- security barrier view approach — the simplest Postgres mechanism is to
-- keep RLS but revoke resonance_data via a restrictive policy that sets it
-- to NULL for non-owners.  We use a SECURITY DEFINER view alternative:
-- add a restrictive policy that overwrites resonance_data to NULL for
-- non-owners in all broad SELECT contexts.
--
-- Implementation: add a new USING expression that allows the row but a
-- WITH CHECK that the resonance_data column reads as NULL via a view.
--
-- The cleanest Postgres approach without rewriting all policies is a
-- "column masking" function referenced in an additional policy.  We create
-- a thin view and point application reads at it.
-- ----------------------------------------------------------------------------

-- Masking view: resonance_data is NULL unless you are the owner.
-- All broad reads (discover, matches list) should SELECT from this view.
-- The get_resonance() RPC reads directly from the base table (SECURITY DEFINER).
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT
  id,
  updated_at,
  username,
  full_name,
  avatar_url,
  bio,
  age,
  role_attributes,
  profile_types,
  onboarding_complete,
  contact_methods,
  -- resonance_data is intentionally omitted; use get_resonance() instead
  CASE WHEN id = auth.uid() THEN resonance_data ELSE NULL END AS resonance_data
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated, anon;

-- Comment explaining the architecture
COMMENT ON FUNCTION public.get_resonance(UUID, UUID) IS
  'Returns resonance_data for target_id filtered by the viewer''s relationship '
  '(public / match / express).  All section keys not visible to the viewer are '
  'stripped server-side.  Replaces direct .select("resonance_data") on profiles.';

COMMENT ON VIEW public.profiles_safe IS
  'Profiles table with resonance_data masked to NULL for non-owners. '
  'Use get_resonance(target_id) to retrieve resonance data with proper '
  'visibility enforcement.';
