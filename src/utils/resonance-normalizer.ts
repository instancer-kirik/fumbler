/**
 * Normalizes imported resonance data (from JSON/TOON) into the internal
 * editor format used by ResonanceEditor.
 *
 * The canonical JSON export uses keys like `coreResonance`, `activationVectors`,
 * `consumerInterface`, etc., whereas the editor stores flattened keys like
 * `core`, `consumer`, `viability`.
 */

type Obj = Record<string, unknown>;

function pick<T>(source: unknown, ...keys: string[]): T | undefined {
  if (!source || typeof source !== "object") return undefined;
  const s = source as Obj;
  for (const k of keys) {
    if (s[k] !== undefined) return s[k] as T;
  }
  return undefined;
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/**
 * Takes raw imported data (any structure) and maps it to the internal
 * ResonanceData shape expected by ResonanceEditor.
 */
export function normalizeImportData(raw: Obj): Obj {
  // If it already uses internal keys (e.g. `core`), return as-is
  if (raw.core && typeof raw.core === "object") {
    return raw;
  }

  const result: Obj = {};

  // ── Core Resonance ──────────────────────────────────────────────────
  const cr = (raw.coreResonance || raw.core_resonance || {}) as Obj;
  const attention = (cr.attention || {}) as Obj;

  result.core = {
    attentionModel: str(attention.description || attention.desc || cr.attentionModel),
    activationVectors: {
      attracts: arr(cr.activationVectors || pick(cr, "activation_vectors")),
      repels: arr(cr.repulsionVectors || pick(cr, "repulsion_vectors")),
    },
    flirtInterface: {
      attracts: arr((cr.flirtInterface as Obj)?.attracts),
      failsWhen: arr((cr.flirtInterface as Obj)?.failsWhen),
    },
  };

  // ── Consumer Interface ──────────────────────────────────────────────
  const ci = (cr.consumerInterface || cr.consumer_interface || raw.consumer || {}) as Obj;
  result.consumer = {
    trustSignals: arr(ci.trustSignals || ci.trust_signals),
    distrustSignals: arr(ci.distrustSignals || ci.distrust_signals),
  };

  // ── Glossary ────────────────────────────────────────────────────────
  result.glossary = cr.glossary || raw.glossary || {};

  // ── Viability ───────────────────────────────────────────────────────
  const v = (raw.viability || {}) as Obj;
  const avail = (v.availability || {}) as Obj;
  result.viability = {
    currentSeason: str(avail.currentSeason || avail.current_season, "exploring"),
    engagementFrequency: str(avail.engagementFrequency || avail.engagement_frequency || avail.freq),
    weeklyHours: str(avail.weeklyHours || avail.weekly_hours || avail.hours),
    conflictStyle: str(v.conflictStyle || v.conflict_style),
    reciprocityModel: str(v.reciprocityModel || v.reciprocity_model),
    relationshipTypes: arr(v.relationshipTypesAvailable || v.relationship_types || v.relationshipTypes),
    coreValues: arr(v.coreValues || v.core_values),
    growthVectors: arr(v.growthVectors || v.growth_vectors),
  };

  // ── Experiential ────────────────────────────────────────────────────
  const exp = (raw.experiential || {}) as Obj;
  const langs = (exp.languages || {}) as Obj;
  const kinks = (exp.kinks || {}) as Obj;
  const type = (exp.type || {}) as Obj;

  result.experiential = {
    loops: arr(exp.loops),
    lessons: arr(exp.lessons),
    languages: {
      receiveLoveThrough: arr(langs.receiveLoveThrough || langs.receive_love_through),
      expressLoveThrough: arr(langs.expressLoveThrough || langs.express_love_through),
      communicationStyle: str(langs.communicationStyle || langs.communication_style),
      creativeExpression: arr(langs.creativeExpression || langs.creative_expression),
      vulnerabilityLanguage: str(langs.vulnerabilityLanguage || langs.vulnerability_language),
    },
    kinks: {
      intellectual: str(kinks.intellectual),
      relational: str(kinks.relational),
      intensity: str(kinks.intensity),
      play: str(kinks.play),
      avoid: str(kinks.avoid),
    },
    type: {
      archetype: str(type.archetype),
      attractionPattern: str(type.attractionPattern || type.attraction_pattern),
      roleInRelationship: str(type.roleInRelationship || type.role_in_relationship),
      recurringPattern: str(type.recurringPattern || type.recurring_pattern),
    },
  };

  // ── Economic ────────────────────────────────────────────────────────
  const econ = (raw.economic || {}) as Obj;
  const rates = (econ.rates || {}) as Obj;
  result.economic = {
    openToInvoicing: bool(econ.openToInvoicing || econ.open_to_invoicing),
    contexts: arr(econ.contexts),
    rates: { ...rates } as Record<string, string>,
    values: arr(econ.valuesAroundThis || econ.values || econ.econ_values),
    boundaries: arr(econ.boundaries || econ.econ_boundaries),
    kinkAlignment: arr(econ.kinkAlignment || econ.kink_alignment || econ.kink_align),
  };

  // ── Seeking ─────────────────────────────────────────────────────────
  const sk = (raw.seeking || {}) as Obj;
  const skLangs = (sk.seekingLanguages || sk.seeking_languages || {}) as Obj;
  result.seeking = {
    activelySeeking: bool(sk.activelySeking || sk.activelySeeking || sk.actively_seeking),
    seekingArchetype: str(sk.seekingArchetype || sk.seeking_archetype),
    seekingLoops: str(sk.seekingLoops || sk.seeking_loops),
    seekingLessons: str(sk.seekingLessons || sk.seeking_lessons),
    seekingKinks: arr(sk.seekingKinks || sk.seeking_kinks),
    nonNegotiables: arr(sk.nonNegotiables || sk.non_negotiables),
    niceToHaves: arr(sk.niceToHaves || sk.nice_to_haves),
  };

  // ── Safety ──────────────────────────────────────────────────────────
  const sf = (raw.safety || {}) as Obj;
  result.safety = {
    consentFrameworks: arr(sf.consentFrameworks || sf.consent_frameworks || sf.consent),
    hardBoundaries: arr(sf.hardBoundaries || sf.hard_boundaries),
    accountability: arr(sf.accountability),
    safeSexPractices: str(sf.safeSexPractices || sf.safe_sex_practices || sf.safe_sex),
    substanceClarity: str(sf.substanceClarity || sf.substance_clarity || sf.substances),
    harmHistory: str(sf.harmHistory || sf.harm_history),
    referencesAvailable: bool(sf.referencesAvailable || sf.references_available || sf.refs_available),
  };

  // ── Connection ──────────────────────────────────────────────────────
  const cn = (raw.connection || {}) as Obj;
  result.connection = {
    preferredContactMethod: str(cn.preferredContactMethod || cn.contact_method),
    responseTimeExpectations: str(cn.responseTimeExpectations || cn.response_time),
    frequencyOfContact: str(cn.frequencyOfContact || cn.contact_freq),
    meetingModality: str(cn.meetingModality || cn.modality, "hybrid"),
    location: str(cn.location),
    willingToTravel: str(cn.willingToTravel || cn.travel),
  };

  // ── Discovery ───────────────────────────────────────────────────────
  const disc = (raw.discovery || {}) as Obj;
  const intro = (disc.introduction || {}) as Obj;
  result.discovery = {
    visibility: str(disc.visibility),
    seekingStatus: str(disc.seekingStatus || disc.seeking_status),
    privacyComfortLevel: str(disc.privacyComfortLevel || disc.privacy, "high"),
    willingToBeCompared: bool(disc.willingToBeCompared || disc.comparable),
    willingToHaveCompatibilityShared: bool(disc.willingToHaveCompatibilityShared || disc.share_compat),
    portfolioLinks: arr(disc.portfolioLinks || disc.portfolio),
    writtenBio: str(intro.writtenBio || disc.bio || raw.bio),
    audioIntro: str(intro.audioIntro),
    videoIntro: str(intro.videoIntro),
  };

  return result;
}
