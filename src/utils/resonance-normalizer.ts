/**
 * Normalizes imported resonance data from any schema version into the
 * internal flat format matching v0.9 of the WOEM resonance profile spec.
 *
 * Handles three input formats:
 *   v9flat    — v0.9+ flat JSON (aura, archetypes[], activationVectors at top level)
 *   oldJSON   — pre-v0.9 JSON export (coreResonance, experiential, consumerInterface)
 *   oldInternal — previous normalizer output (core, consumer, experiential wrappers)
 */

type Obj = Record<string, unknown>;

// ─── Primitives ──────────────────────────────────────────────────────────────

function pick<T>(source: unknown, ...keys: string[]): T | undefined {
  if (!source || typeof source !== "object") return undefined;
  const s = source as Obj;
  for (const k of keys) {
    if (s[k] !== undefined) return s[k] as T;
  }
  return undefined;
}

function arr(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function obj(v: unknown): Obj {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Obj;
  return {};
}

// ─── Format detection ─────────────────────────────────────────────────────────

type SchemaFormat = "v9flat" | "oldJSON" | "oldInternal" | "unknown";

function detectFormat(raw: Obj): SchemaFormat {
  // v0.9+ flat: has aura key, or archetypes[] with definition field, or top-level activationVectors
  if (
    raw.aura ||
    raw.activationVectors ||
    raw.qualities ||
    raw.introspections ||
    (Array.isArray(raw.archetypes) &&
      (raw.archetypes as Obj[]).length > 0 &&
      typeof (raw.archetypes as Obj[])[0].definition === "string")
  ) {
    return "v9flat";
  }
  // Old JSON export: has coreResonance wrapper
  if (raw.coreResonance || raw.core_resonance) {
    return "oldJSON";
  }
  // Old internal format: has core object with attentionModel
  if (raw.core && typeof raw.core === "object") {
    return "oldInternal";
  }
  return "unknown";
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function normalizeImportData(raw: Obj): Obj {
  const format = detectFormat(raw);
  switch (format) {
    case "v9flat":
      return normalizeV9Flat(raw);
    case "oldJSON":
      return normalizeOldJSON(raw);
    case "oldInternal":
      return normalizeOldInternal(raw);
    default:
      return normalizeV9Flat(raw); // best-effort passthrough
  }
}

// ─── v0.9 flat passthrough ────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

function normalizeV9Flat(raw: Obj): Obj {
  const aura = obj(raw.aura);
  const cogStyle = obj(raw.cognitiveStyle);
  const langs = obj(raw.languages);
  const flirt = obj(raw.flirtInterface);
  const seeking = obj(raw.seeking);
  const skLangs = obj(seeking.languages ?? seeking.loveLanguages);
  const econ = obj(raw.economic);
  const viab = obj(raw.viability);
  const avail = obj(viab.availability);
  const safety = obj(raw.safety);
  const conn = obj(raw.connection);
  const disc = obj(raw.discovery);
  const discIntro = obj((disc as Obj).introduction);
  const content = obj(raw.content);
  const gtky = obj(raw.getToKnowMe);
  const attract = obj(raw.attraction);
  const engage = obj(raw.engagement);
  const power = obj(raw.powerDynamics);
  const play = obj(raw.playPreferences);
  const intensity = obj(play.intensityProfile);
  const repulsion = obj(raw.repulsion);

  return {
    // ── Identity surface ──────────────────────────────────────────────────
    aura: {
      descriptors: arr(aura.descriptors),
      misreadAs: arr(aura.misreadAs),
      revealsOverTime: arr(aura.revealsOverTime),
      toneTag: str(aura.toneTag),
    },
    aesthetics: arr(raw.aesthetics),
    aliases: arr(raw.aliases),
    persona: raw.persona ?? null,

    // ── Archetypes — { name, definition, activationContext } ─────────────
    archetypes: Array.isArray(raw.archetypes)
      ? (raw.archetypes as Obj[])
          .filter((a) => a && typeof a === "object")
          .map((a) => ({
            name: str(a.name ?? a.label),
            definition: str(a.definition ?? a.class),
            activationContext: str(a.activationContext ?? a.energy),
          }))
      : [],

    // ── Cognitive / character ─────────────────────────────────────────────
    cognitiveStyle: {
      attention: str(cogStyle.attention),
      patternOriented: bool(cogStyle.patternOriented),
      manualCountingTolerance: str(cogStyle.manualCountingTolerance),
      systemDelegationPreference: str(cogStyle.systemDelegationPreference),
      worksBestWith: str(cogStyle.worksBestWith),
    },
    values: arr(raw.values),
    qualities: arr(raw.qualities),
    introspections: arr(raw.introspections),
    loops: arr(raw.loops),
    lessons: arr(raw.lessons),
    aspirations: arr(raw.aspirations),
    sleepingDreams: arr(raw.sleepingDreams ?? raw.sleeping_dreams ?? raw.dreams),
    growthVectors: arr(raw.growthVectors),

    // ── Expression ────────────────────────────────────────────────────────
    languages: {
      natural: arr(langs.natural ?? langs.spoken),
      receiveLoveThrough: arr(langs.receiveLoveThrough),
      expressLoveThrough: arr(langs.expressLoveThrough),
      communicationStyle: str(langs.communicationStyle),
      creativeExpression: arr(langs.creativeExpression),
      vulnerabilityLanguage: str(langs.vulnerabilityLanguage),
    },
    kinks: {
      intellectual: str(obj(raw.kinks).intellectual),
      relational: str(obj(raw.kinks).relational),
      intensity: str(obj(raw.kinks).intensity),
      play: str(obj(raw.kinks).play),
      avoid: str(obj(raw.kinks).avoid),
    },

    // ── Interpersonal ─────────────────────────────────────────────────────
    activationVectors: arr(raw.activationVectors),
    repulsionVectors: arr(raw.repulsionVectors),
    flirtInterface: {
      attracts: arr(flirt.attracts),
      failsWhen: arr(flirt.failsWhen),
    },
    consumer: {
      trustSignals: arr(raw.trustSignals ?? obj(raw.consumer).trustSignals),
      distrustSignals: arr(
        raw.distrustSignals ?? obj(raw.consumer).distrustSignals,
      ),
    },
    glossary:
      raw.glossary &&
      typeof raw.glossary === "object" &&
      !Array.isArray(raw.glossary)
        ? raw.glossary
        : {},

    // ── Creator ───────────────────────────────────────────────────────────
    ...(raw.content !== undefined && {
      content: {
        categories: arr(content.categories),
        style: arr(content.style),
        schedule: content.schedule ?? null,
      },
    }),

    // ── Seeking ───────────────────────────────────────────────────────────
    seeking: {
      active: bool(
        seeking.active ?? seeking.activelySeeking ?? seeking.activelySeking,
      ),
      archetypes: arr(seeking.archetypes),
      aesthetics: arr(seeking.aesthetics),
      languages: {
        compatibleWith: arr(skLangs.compatibleWith),
        mismatchTolerance: str(skLangs.mismatchTolerance),
      },
      qualities: arr(seeking.qualities),
      intents: arr(seeking.intents),
      kinks: arr(seeking.kinks),
      nonNegotiables: arr(seeking.nonNegotiables),
      niceToHaves: arr(seeking.niceToHaves),
    },
    reciprocityModel: str(raw.reciprocityModel),
    conflictStyle: str(raw.conflictStyle),

    // ── Economic ──────────────────────────────────────────────────────────
    economic: {
      openToInvoicing: bool(econ.openToInvoicing),
      contexts: arr(econ.contexts),
      principles: arr(econ.principles ?? econ.valuesAroundThis ?? econ.values),
      limits: arr(econ.limits ?? econ.boundaries),
      kinkAlignment: arr(econ.kinkAlignment),
    },

    // ── Viability ─────────────────────────────────────────────────────────
    viability: {
      availability: {
        weeklyHours: str(avail.weeklyHours ?? avail.weekly_hours),
        timezone: str(avail.timezone),
        asyncPreferred: bool(avail.asyncPreferred ?? avail.async_preferred),
        currentSeason: str(avail.currentSeason ?? avail.current_season),
      },
      relationshipTypesAvailable: arr(
        viab.relationshipTypesAvailable ??
          viab.relationshipTypes ??
          viab.relationship_types,
      ),
    },

    // ── Safety ────────────────────────────────────────────────────────────
    safety: {
      consentFrameworks: arr(safety.consentFrameworks),
      hardBoundaries: arr(safety.hardBoundaries),
      harmHistory: str(safety.harmHistory),
      accountability: arr(safety.accountability),
      referencesAvailable: bool(safety.referencesAvailable),
      safeSexPractices: str(safety.safeSexPractices),
      substanceClarity: str(safety.substanceClarity),
    },

    // ── Connection ────────────────────────────────────────────────────────
    connection: {
      channelPrimary: str(conn.channelPrimary ?? conn.preferredContactMethod),
      channelSecondary: str(conn.channelSecondary),
      contactEtiquette: str(
        conn.contactEtiquette ?? conn.preferredContactMethod,
      ),
      responseTimeExpectations: str(conn.responseTimeExpectations),
      frequencyOfContact: str(conn.frequencyOfContact),
      meetingModality: str(conn.meetingModality, "hybrid"),
      location: str(conn.location),
      willingToTravel: str(conn.willingToTravel),
    },

    // ── Discovery ─────────────────────────────────────────────────────────
    discovery: {
      visibility: str((disc as Obj).visibility),
      contentRating: str((disc as Obj).contentRating),
      privacyComfortLevel: str((disc as Obj).privacyComfortLevel, "high"),
      willingToBeCompared: bool((disc as Obj).willingToBeCompared),
      willingToHaveCompatibilityShared: bool(
        (disc as Obj).willingToHaveCompatibilityShared,
      ),
      introduction: {
        writtenBio: str(
          discIntro.writtenBio ?? (disc as Obj).writtenBio ?? raw.bio,
        ),
        audioIntro: discIntro.audioIntro ?? null,
        videoIntro: discIntro.videoIntro ?? null,
      },
      platforms: Array.isArray((disc as Obj).platforms)
        ? ((disc as Obj).platforms as Obj[])
            .filter((p) => p && typeof p === "object")
            .map((p) => ({
              name: str(p.name),
              handle: str(p.handle),
              url: str(p.url),
            }))
        : arr((disc as Obj).portfolioLinks).map((url) => ({
            name: "",
            handle: "",
            url,
          })),
    },

    // ── Get to Know Me ────────────────────────────────────────────────────
    getToKnowMe: {
      height: gtky.height ?? null,
      build: str(gtky.build),
      favoriteMedia: arr(gtky.favoriteMedia),
      currentObsession: str(gtky.currentObsession),
      idealWeekend: str(gtky.idealWeekend),
    },

    // ── Attraction Gradient ───────────────────────────────────────────────
    attraction: {
      slowBurn: bool(attract.slowBurn),
      fastHook: bool(attract.fastHook),
      whatDrawsIn: arr(attract.whatDrawsIn),
      timeline: str(attract.timeline),
    },

    // ── Engagement Curve ──────────────────────────────────────────────────
    engagement: {
      phase1: str(engage.phase1),
      phase2: str(engage.phase2),
      phase3: str(engage.phase3),
      cooperationStyle: str(engage.cooperationStyle),
    },

    // ── Power Dynamics ────────────────────────────────────────────────────
    powerDynamics: {
      enabled: bool(power.enabled),
      expressionModes: arr(power.expressionModes),
      exploration: str(power.exploration),
    },

    // ── Play Preferences ─────────────────────────────────────────────────
    playPreferences: {
      mode: str(play.mode),
      intensityProfile: {
        emotional: num(intensity.emotional, 50),
        theatrical: num(intensity.theatrical, 50),
        intellectual: num(intensity.intellectual, 50),
      },
    },

    // ── Repulsion (structured) ────────────────────────────────────────────
    repulsion: {
      hardStops: arr(repulsion.hardStops),
      yellowFlags: arr(repulsion.yellowFlags),
      patternConcerns: arr(repulsion.patternConcerns),
    },

    // ── Section visibility ────────────────────────────────────────────────
    sectionVisibility: obj(raw.sectionVisibility),
  };
}

// ─── Old JSON export (coreResonance / experiential wrappers) ──────────────────

function normalizeOldJSON(raw: Obj): Obj {
  const cr = obj(raw.coreResonance ?? raw.core_resonance);
  const attn = obj(cr.attention);
  const ci = obj(cr.consumerInterface ?? cr.consumer_interface);
  const flirt = obj(cr.flirtInterface ?? cr.flirt_interface);
  const v = obj(raw.viability);
  const avail = obj(v.availability);
  const exp = obj(raw.experiential);
  const langs = obj(exp.languages);
  const kinks = obj(exp.kinks);
  const type = obj(exp.type);
  const sk = obj(raw.seeking);
  const skL = obj(sk.seekingLanguages ?? sk.seeking_languages);
  const econ = obj(raw.economic);
  const sf = obj(raw.safety);
  const cn = obj(raw.connection);
  const disc = obj(raw.discovery);
  const intro = obj(disc.introduction);

  // Synthesize a v9-flat-shaped object and run through v9 normalizer
  return normalizeV9Flat({
    activationVectors: cr.activationVectors ?? cr.activation_vectors,
    repulsionVectors: cr.repulsionVectors ?? cr.repulsion_vectors,
    flirtInterface: flirt,
    trustSignals: ci.trustSignals ?? ci.trust_signals,
    distrustSignals: ci.distrustSignals ?? ci.distrust_signals,
    cognitiveStyle: {
      attention: str(attn.description ?? attn.desc ?? cr.attentionModel),
    },
    glossary: cr.glossary ?? raw.glossary,

    values: v.coreValues ?? v.core_values,
    growthVectors: v.growthVectors ?? v.growth_vectors,
    conflictStyle: v.conflictStyle ?? v.conflict_style,
    reciprocityModel: v.reciprocityModel ?? v.reciprocity_model,

    loops: exp.loops,
    lessons: exp.lessons,
    aspirations: exp.aspirations ?? raw.aspirations,
    sleepingDreams: exp.sleepingDreams ?? raw.sleepingDreams ?? raw.sleeping_dreams ?? raw.dreams,
    languages: {
      receiveLoveThrough:
        langs.receiveLoveThrough ?? langs.receive_love_through,
      expressLoveThrough:
        langs.expressLoveThrough ?? langs.express_love_through,
      communicationStyle: langs.communicationStyle ?? langs.communication_style,
      creativeExpression: langs.creativeExpression ?? langs.creative_expression,
      vulnerabilityLanguage:
        langs.vulnerabilityLanguage ?? langs.vulnerability_language,
    },
    kinks,
    archetypes: type.archetype
      ? [
          {
            name: str(type.archetype),
            definition: str(type.attractionPattern),
            activationContext: str(type.roleInRelationship),
          },
        ]
      : [],

    seeking: {
      active: sk.activelySeking ?? sk.activelySeeking ?? sk.actively_seeking,
      archetypes: sk.seekingArchetype
        ? [str(sk.seekingArchetype ?? sk.seeking_archetype)]
        : [],
      languages: {
        compatibleWith: skL.compatibleWith,
        mismatchTolerance: skL.mismatchTolerance,
      },
      kinks: sk.seekingKinks ?? sk.seeking_kinks,
      nonNegotiables: sk.nonNegotiables ?? sk.non_negotiables,
      niceToHaves: sk.niceToHaves ?? sk.nice_to_haves,
    },

    economic: {
      openToInvoicing: econ.openToInvoicing ?? econ.open_to_invoicing,
      contexts: econ.contexts,
      principles: econ.valuesAroundThis ?? econ.values ?? econ.econ_values,
      limits: econ.boundaries ?? econ.econ_boundaries,
      kinkAlignment: econ.kinkAlignment ?? econ.kink_alignment,
    },

    viability: {
      availability: {
        weeklyHours: avail.weeklyHours ?? avail.weekly_hours,
        timezone: avail.timezone,
        asyncPreferred: avail.asyncPreferred ?? avail.async_preferred,
        currentSeason: avail.currentSeason ?? avail.current_season,
      },
      relationshipTypesAvailable:
        v.relationshipTypesAvailable ??
        v.relationship_types ??
        v.relationshipTypes,
    },

    safety: {
      consentFrameworks: sf.consentFrameworks ?? sf.consent_frameworks,
      hardBoundaries: sf.hardBoundaries ?? sf.hard_boundaries,
      harmHistory: sf.harmHistory ?? sf.harm_history,
      accountability: sf.accountability,
      referencesAvailable: sf.referencesAvailable ?? sf.references_available,
      safeSexPractices: sf.safeSexPractices ?? sf.safe_sex_practices,
      substanceClarity: sf.substanceClarity ?? sf.substance_clarity,
    },

    connection: {
      channelPrimary:
        cn.channelPrimary ?? cn.preferredContactMethod ?? cn.contact_method,
      channelSecondary: cn.channelSecondary,
      contactEtiquette: cn.contactEtiquette ?? cn.preferredContactMethod,
      responseTimeExpectations: cn.responseTimeExpectations ?? cn.response_time,
      frequencyOfContact: cn.frequencyOfContact ?? cn.contact_freq,
      meetingModality: cn.meetingModality ?? cn.modality,
      location: cn.location,
      willingToTravel: cn.willingToTravel ?? cn.travel,
    },

    discovery: {
      visibility: disc.visibility,
      contentRating: disc.contentRating,
      privacyComfortLevel: disc.privacyComfortLevel ?? disc.privacy,
      willingToBeCompared: disc.willingToBeCompared ?? disc.comparable,
      willingToHaveCompatibilityShared:
        disc.willingToHaveCompatibilityShared ?? disc.share_compat,
      introduction: {
        writtenBio: intro.writtenBio ?? disc.bio ?? raw.bio,
        audioIntro: intro.audioIntro,
        videoIntro: intro.videoIntro,
      },
      // portfolioLinks → platforms with empty name/handle
      platforms: disc.portfolioLinks,
    },
  });
}

// ─── Old internal format (core / consumer / experiential wrappers) ────────────

function normalizeOldInternal(raw: Obj): Obj {
  const core = obj(raw.core);
  const av = obj(core.activationVectors);
  const consumer = obj(raw.consumer);
  const exp = obj(raw.experiential);
  const langs = obj(exp.languages);
  const kinks = obj(exp.kinks);
  const type = obj(exp.type);
  const sk = obj(raw.seeking);
  const skL = obj(sk.seekingLanguages);
  const v = obj(raw.viability);
  const econ = obj(raw.economic);

  return normalizeV9Flat({
    activationVectors: av.attracts,
    repulsionVectors: av.repels,
    flirtInterface: core.flirtInterface,
    trustSignals: consumer.trustSignals,
    distrustSignals: consumer.distrustSignals,
    cognitiveStyle: { attention: str(core.attentionModel) },
    glossary: core.glossary ?? raw.glossary,

    values: v.coreValues,
    growthVectors: v.growthVectors,
    conflictStyle: v.conflictStyle,
    reciprocityModel: v.reciprocityModel,

    loops: exp.loops,
    lessons: exp.lessons,
    aspirations: exp.aspirations,
    sleepingDreams: exp.sleepingDreams,
    languages: {
      receiveLoveThrough: langs.receiveLoveThrough,
      expressLoveThrough: langs.expressLoveThrough,
      communicationStyle: langs.communicationStyle,
      creativeExpression: langs.creativeExpression,
      vulnerabilityLanguage: langs.vulnerabilityLanguage,
    },
    kinks,
    archetypes: type.archetype
      ? [
          {
            name: str(type.archetype),
            definition: str(type.attractionPattern),
            activationContext: str(type.roleInRelationship),
          },
        ]
      : [],

    seeking: {
      active: sk.activelySeeking ?? sk.activelySeking,
      archetypes: sk.seekingArchetype ? [str(sk.seekingArchetype)] : [],
      languages: {
        compatibleWith: skL.compatibleWith,
        mismatchTolerance: skL.mismatchTolerance,
      },
      kinks: sk.seekingKinks,
      nonNegotiables: sk.nonNegotiables,
      niceToHaves: sk.niceToHaves,
    },

    economic: {
      openToInvoicing: econ.openToInvoicing,
      contexts: econ.contexts,
      principles: econ.values ?? econ.valuesAroundThis,
      limits: econ.boundaries,
      kinkAlignment: econ.kinkAlignment,
    },

    // Pass these through as-is; normalizeV9Flat will handle them
    viability: raw.viability,
    safety: raw.safety,
    connection: raw.connection,
    discovery: raw.discovery,
    getToKnowMe: raw.getToKnowMe,
  });
}
