// ============================================================================
// FUMBLE RESONANCE PROFILE — Full Type System
// ============================================================================

export interface ActivationVectors {
  attracts: string[];
  repels: string[];
}

export interface FlirtInterface {
  attracts: string[];
  failsWhen: string[];
}

export interface CoreResonance {
  attentionModel: string;
  activationVectors: ActivationVectors;
  flirtInterface: FlirtInterface;
  glossary: Record<string, { meaning: string; state: string }>;
}

export interface ViabilityProfile {
  availability: {
    engagementFrequency: "daily" | "weekly" | "monthly";
    weeklyHours: string;
    timezone: string;
    asyncPreferred: boolean;
    currentSeason: "available_and_seeking" | "closed" | "healing" | "exploring";
  };
  relationshipTypes: string[];
  conflictStyle:
    | "use_for_understanding"
    | "avoidance"
    | "confrontation"
    | "dialogue";
  reciprocityModel: "symmetric_preferred" | "asymmetric_ok" | "flexible";
  communicationModalities: {
    primary: string;
    secondary: string;
    frequencyPreference: string;
  };
  growthVectors: string[];
  coreValues: string[];
}

export interface ExperientialProfile {
  loops: string[];
  lessons: string[];
  languages: {
    receiveLoveThrough: string[];
    expressLoveThrough: string[];
    communicationStyle: string;
    creativeExpression: string[];
    vulnerabilityLanguage: string;
  };
  kinks: {
    intellectual: string;
    relational: string;
    intensity: string;
    play: string;
    avoid: string;
  };
  type: {
    archetype: string;
    attractionPattern: string;
    roleInRelationship: string;
    recurringPattern: string;
  };
}

// ============================================================================
// NEW LAYERS — Attraction, Dynamics, Trust, Discovery media
// ============================================================================

export interface ArchetypePacket {
  id: string;
  label: string;
  class: string;
  aesthetic: string[];
  energy: string;
  dynamic: string;
  tone: string;
  performance: string;
  isCustom: boolean;
}

export interface AttractionGradient {
  slowBurn: boolean;
  fastHook: boolean;
  whatDrawsIn: string[];
  timeline: string;
}

export interface EngagementCurve {
  phase1: string;
  phase2: string;
  phase3: string;
  cooperationStyle: string;
}

export interface PowerDynamics {
  enabled: boolean;
  expressionModes: string[];
  exploration: string;
}

export interface PlayPreferences {
  mode: string;
  intensityProfile: {
    emotional: number;
    theatrical: number;
    intellectual: number;
  };
}

export interface RepulsionVectors {
  hardStops: string[];
  yellowFlags: string[];
  patternConcerns: string[];
}

export interface TrustProfile {
  harmHistory: string;
  referencesAvailable: boolean;
}

export interface DiscoveryIntroduction {
  audioIntro: string;
  videoIntro: string;
}

// ============================================================================
// Existing layers
// ============================================================================

export interface EconomicLayer {
  openToInvoicing: boolean;
  contexts: string[];
  rates: Record<string, string>;
  values: string[];
  boundaries: string[];
  kinkAlignment: string[];
}

export interface SeekingProfile {
  activelySeeking: boolean;
  seekingArchetype: string;
  seekingLoops: string;
  seekingLanguages: {
    compatibleWith: string[];
    mismatchTolerance: "low" | "medium" | "high";
  };
  seekingLessons: string;
  seekingKinks: string[];
  nonNegotiables: string[];
  niceToHaves: string[];
}

export interface SafetyProfile {
  consentFrameworks: string[];
  hardBoundaries: string[];
  accountability: string[];
  safeSexPractices: string;
  substanceClarity: string;
  harmHistory: string;
  referencesAvailable: boolean;
}

export interface ConnectionPreferences {
  preferredContactMethod: string;
  responseTimeExpectations: string;
  frequencyOfContact: string;
  meetingModality: "online" | "in_person" | "hybrid";
  location: string;
  willingToTravel: string;
}

export interface ResonanceProfile {
  id: string;
  name: string;
  handle: string;
  description: string;
  image: string;
  age: number;
  distance: string;
  core: CoreResonance;
  viability: ViabilityProfile;
  experiential: ExperientialProfile;
  economic: EconomicLayer;
  seeking: SeekingProfile;
  safety: SafetyProfile;
  connection: ConnectionPreferences;
  interests: string[];
  bio: string;
  prompt: string;
  promptAnswer: string;
}

// ============================================================================
// Section metadata for UI rendering
// ============================================================================

export interface ConsumerInterface {
  trustSignals: string[];
  distrustSignals: string[];
}

export interface GlossaryEntry {
  meaning: string;
  state: string;
}

export interface DiscoveryMetadata {
  visibility: "public" | "authenticated" | "invite_only";
  seekingStatus: string;
  privacyComfortLevel: "low" | "medium" | "high";
  willingToBeCompared: boolean;
  willingToHaveCompatibilityShared: boolean;
  portfolioLinks: string[];
  writtenBio: string;
  audioIntro: string;
  videoIntro: string;
}

export const RESONANCE_SECTIONS = [
  {
    id: "gtky",
    label: "Get to Know Me",
    icon: "👤",
    description: "Surface texture & anchors",
  },
  {
    id: "aura",
    label: "Aura",
    icon: "🌀",
    description: "How you land before context",
  },
  {
    id: "core",
    label: "Core Resonance",
    icon: "🎯",
    description: "Activation, repulsion & flirt interface",
  },
  {
    id: "signals",
    label: "Signal Field",
    icon: "🔎",
    description: "Trust & distrust signals you emit",
  },
  {
    id: "qualities",
    label: "Qualities",
    icon: "✨",
    description: "Character traits & live introspections",
  },
  {
    id: "loops",
    label: "Loops",
    icon: "🔄",
    description: "Behavioral recursion",
  },
  {
    id: "lessons",
    label: "Lessons",
    icon: "💡",
    description: "Integrated wisdom",
  },
  {
    id: "languages",
    label: "Languages",
    icon: "💬",
    description: "Expression & reception",
  },
  {
    id: "kinks",
    label: "Desires",
    icon: "🔥",
    description: "Pleasure & power",
  },
  {
    id: "archetypes",
    label: "Archetypes",
    icon: "🎭",
    description: "Who you are by context",
  },
  {
    id: "attraction",
    label: "Attraction",
    icon: "🧲",
    description: "What draws you in",
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: "📈",
    description: "Connection phases",
  },
  {
    id: "dynamics",
    label: "Dynamics",
    icon: "⚔️",
    description: "Power & play",
  },
  {
    id: "repulsion",
    label: "Repulsion",
    icon: "🚧",
    description: "Hard stops & flags",
  },
  {
    id: "viability",
    label: "Viability",
    icon: "⚡",
    description: "Season, capacity & open types",
  },
  {
    id: "seeking",
    label: "Seeking",
    icon: "🧭",
    description: "What you're looking for",
  },
  {
    id: "safety",
    label: "Safety",
    icon: "🛡️",
    description: "Consent & boundaries",
  },
  {
    id: "economic",
    label: "Economic",
    icon: "💎",
    description: "Labor & exchange",
  },
  {
    id: "connection",
    label: "Connect",
    icon: "📡",
    description: "Logistics & preferences",
  },
  { id: "content", label: "Content", icon: "📺", description: "What you make" },
  {
    id: "glossary",
    label: "Glossary",
    icon: "📖",
    description: "Your personal lexicon",
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: "🔭",
    description: "How you want to be found",
  },
  // legacy — kept for backward compat with stored visibility settings
  {
    id: "consumer",
    label: "Consumer (legacy)",
    icon: "🔎",
    description: "Legacy signal field",
  },
  {
    id: "type",
    label: "Type (legacy)",
    icon: "🪞",
    description: "Legacy relational archetype",
  },
] as const;

// Archetype presets
export const ARCHETYPE_PRESETS: Omit<ArchetypePacket, "id" | "isCustom">[] = [
  {
    label: "Pastel Goth",
    class: "aesthetic",
    aesthetic: ["soft", "dark", "layered"],
    energy: "low_simmer",
    dynamic: "receptive",
    tone: "melancholic_play",
    performance: "subtle",
  },
  {
    label: "Maid Ritual",
    class: "service",
    aesthetic: ["precise", "devotional"],
    energy: "attentive",
    dynamic: "service_oriented",
    tone: "earnest",
    performance: "theatrical",
  },
  {
    label: "Chaos Architect",
    class: "creative",
    aesthetic: ["maximalist", "kinetic"],
    energy: "high_spark",
    dynamic: "initiating",
    tone: "playful_serious",
    performance: "bold",
  },
  {
    label: "Soft Dom Scholar",
    class: "power",
    aesthetic: ["refined", "warm"],
    energy: "steady",
    dynamic: "guiding",
    tone: "authoritative_gentle",
    performance: "controlled",
  },
  {
    label: "Feral Tender",
    class: "wild",
    aesthetic: ["raw", "organic"],
    energy: "volatile",
    dynamic: "responsive",
    tone: "fierce_caring",
    performance: "instinctive",
  },
];

// ============================================================================
// Mock resonance profiles for existing profiles
// ============================================================================

import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";

const defaultCore: CoreResonance = {
  attentionModel: "Engagement through emergent alignment, not persuasion",
  activationVectors: {
    attracts: [
      "competent_weirdness",
      "layered_meaning",
      "curiosity_invitation",
    ],
    repels: [
      "performative_confidence",
      "over_explanation",
      "extractive_attention",
    ],
  },
  flirtInterface: {
    attracts: ["calm_curiosity", "subtle_mastery", "specific_noticing"],
    failsWhen: ["intensity_too_early", "emotional_oversharing_without_context"],
  },
  glossary: {},
};

const defaultViability: ViabilityProfile = {
  availability: {
    engagementFrequency: "daily",
    weeklyHours: "5-10",
    timezone: "US/Pacific",
    asyncPreferred: true,
    currentSeason: "available_and_seeking",
  },
  relationshipTypes: ["romantic", "creative_collaboration"],
  conflictStyle: "dialogue",
  reciprocityModel: "symmetric_preferred",
  communicationModalities: {
    primary: "async_text",
    secondary: "voice_calls",
    frequencyPreference: "whenever feels right",
  },
  growthVectors: ["deepening_craft", "emotional_resilience"],
  coreValues: ["autonomy", "authenticity", "emergence_over_control"],
};

const defaultEconomic: EconomicLayer = {
  openToInvoicing: false,
  contexts: [],
  rates: {},
  values: ["explicit_beats_implicit", "labor_deserves_recognition"],
  boundaries: ["only_in_appropriate_contexts"],
  kinkAlignment: [],
};

const defaultSafety: SafetyProfile = {
  consentFrameworks: [
    "enthusiastic_consent_required",
    "check_in_during_intensity",
  ],
  hardBoundaries: ["no_untruth", "no_emotional_manipulation"],
  accountability: ["willing_to_be_called_in", "repair_orientation"],
  safeSexPractices: "discussed_before_intimacy",
  substanceClarity: "occasional_alcohol",
  harmHistory: "",
  referencesAvailable: false,
};

const defaultConnection: ConnectionPreferences = {
  preferredContactMethod: "text_first",
  responseTimeExpectations: "24-48 hours",
  frequencyOfContact: "daily async",
  meetingModality: "hybrid",
  location: "flexible",
  willingToTravel: "for the right person",
};

export const resonanceProfiles: ResonanceProfile[] = [
  {
    id: "1",
    name: "Sarah",
    handle: "@sarah_fumbles",
    description: "Chaos coordinator with a heart of gold",
    image: profile1,
    age: 25,
    distance: "2 mi away",
    bio: "Dog mom • Coffee addict • Will laugh at your jokes even if they're bad",
    interests: ["Hiking", "Coffee", "Dogs", "Photography"],
    prompt: "My biggest fumble was...",
    promptAnswer:
      "Waving back at someone who wasn't waving at me. For 30 seconds.",
    core: {
      ...defaultCore,
      activationVectors: {
        attracts: ["genuine_humor", "adventurous_spirit", "grounded_warmth"],
        repels: ["try_hard_energy", "negging", "emotional_unavailability"],
      },
      flirtInterface: {
        attracts: [
          "making_me_laugh",
          "remembering_details",
          "comfortable_silence",
        ],
        failsWhen: ["love_bombing", "too_much_too_soon"],
      },
    },
    viability: {
      ...defaultViability,
      relationshipTypes: ["romantic", "adventure_partner"],
      coreValues: ["loyalty", "humor", "growth"],
    },
    experiential: {
      loops: [
        "I over-give then feel resentful, then feel guilty for the resentment",
        "I test people's patience unconsciously — if they stay, I trust",
        "I intellectualize my feelings, then crash when they catch up",
      ],
      lessons: [
        "Not everyone who's nice wants something from me",
        "I don't have to earn love through usefulness",
        "Setting boundaries isn't selfish — it's self-respect",
        "The right person won't need me to perform happiness",
      ],
      languages: {
        receiveLoveThrough: [
          "quality_time",
          "physical_touch",
          "acts_of_service",
        ],
        expressLoveThrough: [
          "acts_of_service",
          "words_of_affirmation",
          "gifts",
        ],
        communicationStyle:
          "warm and direct with a layer of self-deprecating humor",
        creativeExpression: ["photography", "cooking", "journaling"],
        vulnerabilityLanguage: "humor first, then raw honesty when safe",
      },
      kinks: {
        intellectual: "someone who makes me think differently",
        relational: "being fully chosen, not just convenient",
        intensity: "slow burn that becomes a bonfire",
        play: "teasing banter that goes deep",
        avoid: "possessiveness disguised as passion",
      },
      type: {
        archetype: "the nurturer who forgets to nurture herself",
        attractionPattern: "drawn to emotionally complex people who need space",
        roleInRelationship: "the one who holds things together",
        recurringPattern: "caretake → exhaust → withdraw → miss them",
      },
    },
    economic: defaultEconomic,
    seeking: {
      activelySeeking: true,
      seekingArchetype: "grounded adventurer",
      seekingLoops: "someone who iterates on themselves, not stagnates",
      seekingLanguages: {
        compatibleWith: ["quality_time", "physical_touch"],
        mismatchTolerance: "medium",
      },
      seekingLessons:
        "someone who's done their inner work but doesn't make it their personality",
      seekingKinks: [
        "intellectual_challenge",
        "emotional_safety",
        "playful_intensity",
      ],
      nonNegotiables: ["emotional_availability", "humor", "growth_mindset"],
      niceToHaves: ["loves_dogs", "can_cook", "reads_books"],
    },
    safety: defaultSafety,
    connection: defaultConnection,
  },
  {
    id: "2",
    name: "Jake",
    handle: "@jake_the_fumble",
    description: "Building things and burning pasta",
    image: profile2,
    age: 28,
    distance: "5 mi away",
    bio: "6'1\" since everyone asks • Makes a mean pasta • Probably funnier than you",
    interests: ["Cooking", "Basketball", "Music", "Travel"],
    prompt: "I'm convinced that...",
    promptAnswer: "Pineapple on pizza is elite and I will die on this hill.",
    core: {
      ...defaultCore,
      activationVectors: {
        attracts: [
          "playful_confidence",
          "creative_energy",
          "depth_under_humor",
        ],
        repels: [
          "passive_aggression",
          "entitlement",
          "performative_vulnerability",
        ],
      },
    },
    viability: {
      ...defaultViability,
      conflictStyle: "use_for_understanding",
      coreValues: ["honesty", "adventure", "presence"],
    },
    experiential: {
      loops: [
        "I deflect with humor when things get heavy",
        "I go silent instead of saying I'm hurt",
        "I plan exits before I'm even uncomfortable",
      ],
      lessons: [
        "My independence was actually avoidance in disguise",
        "Vulnerability isn't weakness — running is",
        "I can be loved for who I am, not what I provide",
      ],
      languages: {
        receiveLoveThrough: ["words_of_affirmation", "quality_time"],
        expressLoveThrough: ["acts_of_service", "quality_time", "cooking"],
        communicationStyle: "direct with humor, serious when it matters",
        creativeExpression: ["music", "cooking", "storytelling"],
        vulnerabilityLanguage: "action first, words later",
      },
      kinks: {
        intellectual: "someone who can keep up in conversation",
        relational: "mutual admiration without competition",
        intensity: "high energy that knows when to be still",
        play: "challenge me but don't try to fix me",
        avoid: "clingy without self-awareness",
      },
      type: {
        archetype: "the charming deflector learning to stay",
        attractionPattern: "drawn to grounded, emotionally intelligent people",
        roleInRelationship: "the energizer — makes everything feel alive",
        recurringPattern: "attract → enjoy → panic → flee → regret",
      },
    },
    economic: defaultEconomic,
    seeking: {
      activelySeeking: true,
      seekingArchetype:
        "someone real who also doesn't take themselves too seriously",
      seekingLoops: "people who can call me on my shit lovingly",
      seekingLanguages: {
        compatibleWith: ["words_of_affirmation", "quality_time"],
        mismatchTolerance: "medium",
      },
      seekingLessons:
        "someone who's learned that being chill isn't the same as being unavailable",
      seekingKinks: [
        "intellectual_banter",
        "authentic_presence",
        "playful_edge",
      ],
      nonNegotiables: ["honesty", "sense_of_humor", "self_awareness"],
      niceToHaves: ["active_lifestyle", "musical", "foodie"],
    },
    safety: defaultSafety,
    connection: defaultConnection,
  },
  {
    id: "3",
    name: "Maya",
    handle: "@maya_unfumbled",
    description: "Lifting heavy things and heavy books",
    image: profile3,
    age: 30,
    distance: "1 mi away",
    bio: "Bookworm who also lifts • Your mom will love me • Chronically early",
    interests: ["Reading", "Fitness", "Wine", "Art"],
    prompt: "The way to my heart is...",
    promptAnswer: "A perfectly curated Spotify playlist and fancy cheese.",
    core: {
      ...defaultCore,
      activationVectors: {
        attracts: ["quiet_competence", "emotional_depth", "intentional_living"],
        repels: [
          "inconsistency",
          "surface_level_conversation",
          "chaos_for_chaos_sake",
        ],
      },
    },
    viability: {
      ...defaultViability,
      availability: {
        ...defaultViability.availability,
        currentSeason: "exploring",
      },
      coreValues: ["integrity", "depth", "growth"],
    },
    experiential: {
      loops: [
        "I over-research before I act — analysis paralysis in love",
        "I build walls that look like standards",
        "I need full resolution before I can move forward",
      ],
      lessons: [
        "My high standards were sometimes a wall against intimacy",
        "Being 'too much' is only true for the wrong person",
        "I learned to let people surprise me instead of pre-judging",
      ],
      languages: {
        receiveLoveThrough: [
          "quality_time",
          "physical_touch",
          "words_of_affirmation",
        ],
        expressLoveThrough: ["quality_time", "gifts", "acts_of_service"],
        communicationStyle: "thoughtful and precise, poetic when comfortable",
        creativeExpression: ["writing", "art", "movement"],
        vulnerabilityLanguage: "slow reveal through shared experiences",
      },
      kinks: {
        intellectual: "deep dives into niche topics together",
        relational: "being truly seen, not idealized",
        intensity: "controlled intensity — passion with presence",
        play: "exploring new ideas and places together",
        avoid: "shallow charm without substance",
      },
      type: {
        archetype: "the discerning heart learning to soften",
        attractionPattern:
          "drawn to people who match her depth but bring lightness",
        roleInRelationship: "the anchor — steady, reliable, deep",
        recurringPattern:
          "evaluate → invest slowly → all in → devastated if betrayed",
      },
    },
    economic: defaultEconomic,
    seeking: {
      activelySeeking: true,
      seekingArchetype: "depth with levity",
      seekingLoops: "someone who processes and grows, not avoids",
      seekingLanguages: {
        compatibleWith: ["quality_time", "words_of_affirmation"],
        mismatchTolerance: "low",
      },
      seekingLessons:
        "someone who's learned that vulnerability isn't a transaction",
      seekingKinks: [
        "intellectual_depth",
        "emotional_presence",
        "gentle_intensity",
      ],
      nonNegotiables: [
        "consistency",
        "intellectual_curiosity",
        "emotional_maturity",
      ],
      niceToHaves: ["reads", "active", "appreciates_art"],
    },
    safety: defaultSafety,
    connection: defaultConnection,
  },
  {
    id: "4",
    name: "Alex",
    handle: "@alex_designs",
    description: "Making pixels and plants thrive",
    image: profile4,
    age: 26,
    distance: "3 mi away",
    bio: "Design nerd • Plant dad • Will remember your coffee order after one date",
    interests: ["Design", "Plants", "Gaming", "Yoga"],
    prompt: "On a Sunday you'll find me...",
    promptAnswer:
      "Talking to my plants like they understand relationship advice.",
    core: {
      ...defaultCore,
      activationVectors: {
        attracts: [
          "creative_sensitivity",
          "gentle_observation",
          "quiet_confidence",
        ],
        repels: [
          "aggressive_energy",
          "dismissiveness",
          "emotional_carelessness",
        ],
      },
    },
    viability: {
      ...defaultViability,
      conflictStyle: "dialogue",
      coreValues: ["empathy", "creativity", "intentionality"],
    },
    experiential: {
      loops: [
        "I people-please then resent the dynamic I created",
        "I idealize partners then feel disappointed by reality",
        "I absorb others' emotions and lose track of my own",
      ],
      lessons: [
        "My sensitivity is a superpower, not a weakness",
        "I can't design the perfect relationship — I have to let it be messy",
        "Saying no is an act of love, not rejection",
      ],
      languages: {
        receiveLoveThrough: [
          "acts_of_service",
          "quality_time",
          "physical_touch",
        ],
        expressLoveThrough: ["creation", "quality_time", "small_gestures"],
        communicationStyle: "gentle and observant, visual metaphors",
        creativeExpression: ["design", "gardening", "gaming", "yoga"],
        vulnerabilityLanguage: "through creating something for you",
      },
      kinks: {
        intellectual: "aesthetics and philosophy of design",
        relational: "co-creating something beautiful together",
        intensity: "gentle with surprising depth",
        play: "worldbuilding and imagination",
        avoid: "harshness without tenderness",
      },
      type: {
        archetype: "the sensitive creator learning to take up space",
        attractionPattern: "drawn to bold, expressive people who see his quiet",
        roleInRelationship: "the attentive one — notices everything",
        recurringPattern: "adore → accommodate → disappear → rebuild alone",
      },
    },
    economic: defaultEconomic,
    seeking: {
      activelySeeking: true,
      seekingArchetype: "someone bold who appreciates gentleness",
      seekingLoops: "people who iterate with care, not force",
      seekingLanguages: {
        compatibleWith: ["acts_of_service", "quality_time"],
        mismatchTolerance: "low",
      },
      seekingLessons: "someone who knows their own needs and voices them",
      seekingKinks: ["co_creation", "emotional_safety", "gentle_intensity"],
      nonNegotiables: ["kindness", "self_awareness", "creative_spirit"],
      niceToHaves: ["likes_plants", "appreciates_design", "introspective"],
    },
    safety: defaultSafety,
    connection: defaultConnection,
  },
];

// Helper to get a resonance profile by ID
export const getResonanceProfile = (id: string): ResonanceProfile | undefined =>
  resonanceProfiles.find((p) => p.id === id);
