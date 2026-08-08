import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, X, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  RESONANCE_SECTIONS,
  ARCHETYPE_PRESETS,
} from "@/data/resonance-profile";
import { normalizeImportData } from "@/utils/resonance-normalizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── Types ───────────────────────────────────────────────────────────────────

type Visibility = "public" | "matches" | "express";

interface SectionVisibility {
  [sectionId: string]: Visibility;
}

interface GlossaryEntry {
  meaning: string;
  state: string;
}

/**
 * v0.9 flat resonance data — matches woem-draft.json and ResonanceProfileView
 */
interface ResonanceData {
  // Identity surface
  aura: {
    descriptors: string[];
    misreadAs: string[];
    revealsOverTime: string[];
    toneTag: string;
  };
  aesthetics: string[];
  aliases: string[];
  persona: { name?: string; description?: string } | null;
  archetypes: Array<{
    name: string;
    definition: string;
    activationContext: string;
    id?: string;
    // legacy compat for preset archetypes
    label?: string;
    class?: string;
    aesthetic?: string[];
    energy?: string;
    dynamic?: string;
    tone?: string;
    performance?: string;
    isCustom?: boolean;
  }>;

  // Cognitive / character
  cognitiveStyle: {
    attention: string;
    patternOriented: boolean;
    manualCountingTolerance: string;
    systemDelegationPreference: string;
    worksBestWith: string;
  };
  values: string[];
  qualities: string[];
  introspections: string[];
  loops: string[];
  lessons: string[];
  aspirations: string[];
  sleepingDreams: string[];
  growthVectors: string[];

  // Expression
  languages: {
    natural: string[];
    receiveLoveThrough: string[];
    expressLoveThrough: string[];
    communicationStyle: string;
    creativeExpression: string[];
    vulnerabilityLanguage: string;
  };
  kinks: {
    intellectual: string[];
    relational: string[];
    intensity: string[];
    play: string[];
    avoid: string[];
  };
  desires: Array<{
    label: string;
    intellectual: string[];
    relational: string[];
    intensity: string[];
    play: string[];
    avoid: string[];
  }>;

  // Interpersonal
  activationVectors: string[];
  repulsionVectors: string[];
  flirtInterface: { attracts: string[]; failsWhen: string[] };
  consumer: { trustSignals: string[]; distrustSignals: string[] };
  glossary: Record<string, GlossaryEntry>;

  // Creator
  content: {
    categories: string[];
    style: string[];
    schedule: string | null;
  };

  // Seeking
  seeking: {
    active: boolean;
    archetypes: string[];
    aesthetics: string[];
    languages: { compatibleWith: string[]; mismatchTolerance: string };
    qualities: string[];
    intents: string[];
    kinks: string[];
    nonNegotiables: string[];
    niceToHaves: string[];
  };

  // Offering — roles/postures you're open to playing for someone
  offering: {
    roles: string[];
    notes: string;
  };

  // Collaborations — specific partnership types you're seeking
  collaborations: Array<{
    kind: string;      // e.g. "band", "vehicle_build", "co-op_game"
    role: string;      // your role: e.g. "rhythm_guitar", "welder", "co-designer"
    lookingFor: string; // what you need from a partner
    notes: string;
  }>;

  // Sizing — clothing/dress-up measurements (defaults to express-only visibility)
  sizing: {
    shirt: string;
    pants: string;
    dress: string;
    shoe: string;
    bra: string;
    ring: string;
    hat: string;
    gloves: string;
    waist: string;
    inseam: string;
    height: string;
    notes: string;
  };

  // Faveth — preferred / significant / otherwise important things
  faveth: {
    flowers: string[];
    plants: string[];
    animals: string[];
    vehicles: string[];
    media: string[];
    instruments: string[];
    foodDrink: string[];
    places: string[];
    colors: string[];
    scents: string[];
    dateIdeas: string[];
    other: string[];
  };

  // Skills — what you can do, teach, or want to learn
  skills: Array<{
    name: string;
    level: string; // dabbling | working | solid | deep
    intent: string; // teach | learn | practice
    note: string;
  }>;



  // Frames — identity systems (astrology, MBTI, enneagram, custom)
  frames: {
    astrology: { sun: string; moon: string; rising: string; notes: string };
    mbti: { type: string; notes: string };
    enneagram: { type: string; wing: string; stack: string; notes: string };
    custom: Array<{ system: string; value: string; notes: string }>;
  };



  reciprocityModel: string;
  conflictStyle: string;

  // Practical
  economic: {
    openToInvoicing: boolean;
    contexts: string[];
    principles: string[];
    limits: string[];
    kinkAlignment: string[];
  };
  viability: {
    availability: {
      weeklyHours: string;
      timezone: string;
      asyncPreferred: boolean;
      currentSeason: string;
    };
    relationshipTypesAvailable: string[];
  };
  safety: {
    consentFrameworks: string[];
    hardBoundaries: string[];
    harmHistory: string;
    accountability: string[];
    referencesAvailable: boolean;
    safeSexPractices: string;
    substanceClarity: string;
  };
  connection: {
    channelPrimary: string;
    channelSecondary: string;
    contactEtiquette: string;
    responseTimeExpectations: string;
    frequencyOfContact: string;
    meetingModality: string;
    location: string;
    willingToTravel: string;
  };
  discovery: {
    visibility: string;
    contentRating: string;
    privacyComfortLevel: string;
    willingToBeCompared: boolean;
    willingToHaveCompatibilityShared: boolean;
    introduction: {
      writtenBio: string;
      audioIntro: string | null;
      videoIntro: string | null;
    };
    platforms: Array<{ name: string; handle: string; url: string }>;
  };
  getToKnowMe: {
    height: string | null;
    build: string;
    favoriteMedia: string[];
    favoriteFlowers: string[];
    dateIdeas: string[];
    currentObsession: string;
    idealWeekend: string;
  };

  // Legacy extended fields (editor keeps these for the attraction/dynamics tabs)
  attraction: {
    slowBurn: boolean;
    fastHook: boolean;
    whatDrawsIn: string[];
    timeline: string;
  };
  engagement: {
    phase1: string;
    phase2: string;
    phase3: string;
    cooperationStyle: string;
  };
  powerDynamics: {
    enabled: boolean;
    expressionModes: string[];
    exploration: string;
  };
  playPreferences: {
    mode: string;
    intensityProfile: {
      emotional: number;
      theatrical: number;
      intellectual: number;
    };
  };
  repulsion: {
    hardStops: string[];
    yellowFlags: string[];
    patternConcerns: string[];
  };

  sectionVisibility: SectionVisibility;
}

const emptyData: ResonanceData = {
  aura: { descriptors: [], misreadAs: [], revealsOverTime: [], toneTag: "" },
  aesthetics: [],
  aliases: [],
  persona: null,
  archetypes: [],
  cognitiveStyle: {
    attention: "",
    patternOriented: false,
    manualCountingTolerance: "",
    systemDelegationPreference: "",
    worksBestWith: "",
  },
  values: [],
  qualities: [],
  introspections: [],
  loops: [],
  lessons: [],
  aspirations: [],
  sleepingDreams: [],
  growthVectors: [],
  languages: {
    natural: [],
    receiveLoveThrough: [],
    expressLoveThrough: [],
    communicationStyle: "",
    creativeExpression: [],
    vulnerabilityLanguage: "",
  },
  kinks: {
    intellectual: [],
    relational: [],
    intensity: [],
    play: [],
    avoid: [],
  },
  desires: [],
  activationVectors: [],
  repulsionVectors: [],
  flirtInterface: { attracts: [], failsWhen: [] },
  consumer: { trustSignals: [], distrustSignals: [] },
  glossary: {},
  content: { categories: [], style: [], schedule: null },
  seeking: {
    active: true,
    archetypes: [],
    aesthetics: [],
    languages: { compatibleWith: [], mismatchTolerance: "" },
    qualities: [],
    intents: [],
    kinks: [],
    nonNegotiables: [],
    niceToHaves: [],
  },
  offering: { roles: [], notes: "" },
  collaborations: [],
  sizing: {
    shirt: "", pants: "", dress: "", shoe: "", bra: "", ring: "",
    hat: "", gloves: "", waist: "", inseam: "", height: "", notes: "",
  },
  faveth: {
    flowers: [], plants: [], animals: [], vehicles: [], media: [],
    instruments: [], foodDrink: [], places: [], colors: [], scents: [],
    dateIdeas: [], other: [],
  },
  skills: [],
  frames: {

    astrology: { sun: "", moon: "", rising: "", notes: "" },
    mbti: { type: "", notes: "" },
    enneagram: { type: "", wing: "", stack: "", notes: "" },
    custom: [],
  },


  reciprocityModel: "",
  conflictStyle: "",
  economic: {
    openToInvoicing: false,
    contexts: [],
    principles: [],
    limits: [],
    kinkAlignment: [],
  },
  viability: {
    availability: {
      weeklyHours: "",
      timezone: "",
      asyncPreferred: false,
      currentSeason: "exploring",
    },
    relationshipTypesAvailable: [],
  },
  safety: {
    consentFrameworks: [],
    hardBoundaries: [],
    harmHistory: "",
    accountability: [],
    referencesAvailable: false,
    safeSexPractices: "",
    substanceClarity: "",
  },
  connection: {
    channelPrimary: "",
    channelSecondary: "",
    contactEtiquette: "",
    responseTimeExpectations: "",
    frequencyOfContact: "",
    meetingModality: "hybrid",
    location: "",
    willingToTravel: "",
  },
  discovery: {
    visibility: "",
    contentRating: "",
    privacyComfortLevel: "high",
    willingToBeCompared: false,
    willingToHaveCompatibilityShared: false,
    introduction: { writtenBio: "", audioIntro: null, videoIntro: null },
    platforms: [],
  },
  getToKnowMe: {
    height: null,
    build: "",
    favoriteMedia: [],
    favoriteFlowers: [],
    dateIdeas: [],
    currentObsession: "",
    idealWeekend: "",
  },
  attraction: {
    slowBurn: false,
    fastHook: false,
    whatDrawsIn: [],
    timeline: "",
  },
  engagement: { phase1: "", phase2: "", phase3: "", cooperationStyle: "" },
  powerDynamics: { enabled: false, expressionModes: [], exploration: "" },
  playPreferences: {
    mode: "",
    intensityProfile: { emotional: 50, theatrical: 50, intellectual: 50 },
  },
  repulsion: { hardStops: [], yellowFlags: [], patternConcerns: [] },
  sectionVisibility: {},
};

// ─── Reusable field components ───────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl bg-secondary px-3.5 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all";

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={inputClass + " resize-none"}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    )}
  </div>
);

const TagField = ({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim().replace(/\s+/g, "_");
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {tag.replace(/_/g, " ")}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder || "Type and press Enter"}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addTag}
          className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ListField = ({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) => {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onChange([...items, trimmed]);
      setInput("");
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      <div className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p className="flex-1 text-sm text-foreground/80 italic">{item}</p>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 rounded-full p-1 hover:bg-destructive/20 transition-all flex-shrink-0"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder || "Add an entry..."}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addItem}
          className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ToggleButton = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center gap-3">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
        value
          ? "bg-primary/20 text-primary"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {value ? "Yes" : "No"}
    </button>
  </div>
);

const CheckboxGroup = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-2 block">
      {label}
    </label>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange(
                active
                  ? selected.filter((s) => s !== opt.value)
                  : [...selected, opt.value],
              )
            }
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

const SliderField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <span className="text-xs text-primary font-medium">{value}%</span>
    </div>
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-primary"
    />
  </div>
);

// ─── Visibility toggle ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] =
  [
    { value: "public", label: "Public", icon: "🌍" },
    { value: "matches", label: "Matches", icon: "🤝" },
    { value: "express", label: "Express", icon: "🔒" },
  ];

const VisibilityToggle = ({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) => (
  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
    {VISIBILITY_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(opt.value);
        }}
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
          value === opt.value
            ? "bg-primary/20 text-primary"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
        }`}
        title={opt.label}
      >
        {opt.icon}
      </button>
    ))}
  </div>
);

// ─── Glossary field ──────────────────────────────────────────────────────────

const GlossaryField = ({
  glossary,
  onChange,
}: {
  glossary: Record<string, GlossaryEntry>;
  onChange: (g: Record<string, GlossaryEntry>) => void;
}) => {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [state, setState] = useState("");

  const addEntry = () => {
    const key = term.trim().toLowerCase().replace(/\s+/g, "_");
    if (key && meaning.trim()) {
      onChange({
        ...glossary,
        [key]: { meaning: meaning.trim(), state: state.trim() },
      });
      setTerm("");
      setMeaning("");
      setState("");
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        Personal lexicon
      </label>
      <div className="space-y-2 mb-3">
        {Object.entries(glossary).map(([key, entry]) => (
          <div key={key} className="rounded-xl bg-secondary/50 p-3 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.meaning}
                </p>
                {entry.state && (
                  <span className="inline-block mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    {entry.state.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = { ...glossary };
                  delete next[key];
                  onChange(next);
                }}
                className="opacity-0 group-hover:opacity-100 rounded-full p-1 hover:bg-destructive/20 transition-all"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Term (e.g. leethia)"
          className={inputClass}
        />
        <input
          type="text"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Meaning..."
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State (optional)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addEntry}
            className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Platforms field ─────────────────────────────────────────────────────────

const PlatformsField = ({
  platforms,
  onChange,
}: {
  platforms: Array<{ name: string; handle: string; url: string }>;
  onChange: (p: Array<{ name: string; handle: string; url: string }>) => void;
}) => {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");

  const addPlatform = () => {
    if (url.trim()) {
      onChange([
        ...platforms,
        { name: name.trim(), handle: handle.trim(), url: url.trim() },
      ]);
      setName("");
      setHandle("");
      setUrl("");
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        Platforms / Links
      </label>
      <div className="space-y-2 mb-3">
        {platforms.map((p, i) => (
          <div
            key={i}
            className="rounded-xl bg-secondary/50 p-3 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {p.name || p.url}
              </p>
              {p.handle && (
                <p className="text-xs text-muted-foreground">@{p.handle}</p>
              )}
              <p className="text-xs text-primary truncate">{p.url}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange(platforms.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 rounded-full p-1 hover:bg-destructive/20 transition-all"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Platform (e.g. github)"
          className={inputClass}
        />
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Handle (optional)"
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addPlatform}
            className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Collaborations field ────────────────────────────────────────────────────

type Collaboration = {
  kind: string;
  role: string;
  lookingFor: string;
  notes: string;
};

const CollaborationsField = ({
  items,
  onChange,
}: {
  items: Collaboration[];
  onChange: (v: Collaboration[]) => void;
}) => {
  const [kind, setKind] = useState("");
  const [role, setRole] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [notes, setNotes] = useState("");

  const add = () => {
    if (!kind.trim()) return;
    onChange([
      ...items,
      {
        kind: kind.trim(),
        role: role.trim(),
        lookingFor: lookingFor.trim(),
        notes: notes.trim(),
      },
    ]);
    setKind("");
    setRole("");
    setLookingFor("");
    setNotes("");
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        {items.map((c, i) => (
          <div
            key={i}
            className="rounded-xl bg-secondary/50 p-3 group relative"
          >
            <p className="text-sm font-medium text-foreground">{c.kind}</p>
            {c.role && (
              <p className="text-xs text-muted-foreground">
                my role: {c.role}
              </p>
            )}
            {c.lookingFor && (
              <p className="text-xs text-foreground/80 mt-1">
                seeking: {c.lookingFor}
              </p>
            )}
            {c.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                {c.notes}
              </p>
            )}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded-full p-1 hover:bg-destructive/20 transition-all"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          placeholder="Kind (e.g. band, vehicle build, co-op game, film crew)"
          className={inputClass}
        />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="My role (e.g. rhythm guitar, welder, co-writer)"
          className={inputClass}
        />
        <input
          type="text"
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
          placeholder="Looking for (e.g. vocalist, another wrench, an artist)"
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={add}
            className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};



// ─── Custom Archetype Creator (v0.9 format: name/definition/activationContext) ─

const CustomArchetypeCreator = ({ onAdd }: { onAdd: (arch: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [definition, setDefinition] = useState("");
  const [activationContext, setActivationContext] = useState("");

  const reset = () => {
    setName("");
    setDefinition("");
    setActivationContext("");
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      definition: definition.trim(),
      activationContext: activationContext.trim(),
    });
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-border p-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="h-3.5 w-3.5" />
        Create custom archetype
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-foreground">New Archetype</p>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-full p-1 hover:bg-destructive/20 transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      <TextField
        label="Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Night Gardener, The Archivist"
      />
      <TextField
        label="Definition"
        value={definition}
        onChange={setDefinition}
        placeholder="What this archetype means..."
        multiline
      />
      <TextField
        label="Activation Context"
        value={activationContext}
        onChange={setActivationContext}
        placeholder="When this archetype activates..."
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full rounded-xl bg-primary/20 py-2 text-xs font-semibold text-primary hover:bg-primary/30 disabled:opacity-40 transition-all"
      >
        Add Archetype
      </button>
    </div>
  );
};

// ─── Section wrapper ─────────────────────────────────────────────────────────

const EditorSection = ({
  icon,
  label,
  description,
  children,
  defaultOpen = false,
  visibility,
  onVisibilityChange,
}: {
  icon: string;
  label: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  visibility?: Visibility;
  onVisibilityChange?: (v: Visibility) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) setHasOpened(true);
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">
            {label}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {visibility && onVisibilityChange && (
          <VisibilityToggle value={visibility} onChange={onVisibilityChange} />
        )}
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-3">
              {hasOpened ? children : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Expression mode options ─────────────────────────────────────────────────

const EXPRESSION_MODES = [
  { value: "performative_power_play", label: "Performative Power Play" },
  { value: "ironic_submission", label: "Ironic Submission" },
  { value: "theatrical_absurdity", label: "Theatrical Absurdity" },
  { value: "symbolic_transaction", label: "Symbolic Transaction" },
  { value: "meta_aware_dynamics", label: "Meta-Aware Dynamics" },
];

// ─── Main component ──────────────────────────────────────────────────────────

interface ResonanceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ResonanceEditor = ({ open, onOpenChange }: ResonanceEditorProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<ResonanceData>(emptyData);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      supabase
        .from("profiles")
        .select("resonance_data")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.resonance_data) {
            const raw = profile.resonance_data as Record<string, unknown>;
            const normalized = normalizeImportData(raw);
            setData({ ...emptyData, ...(normalized as any) });
          }
          setLoading(false);
        });
    }
  }, [open, user]);

  // Lock body scroll while the editor overlay is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Use upsert so users whose profile row wasn't created yet are handled gracefully
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, resonance_data: data as any })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Resonance profile saved!");
      onOpenChange(false);
    }
  };

  const set = <T,>(path: string[], value: T) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (obj[path[i]] === undefined) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const vis = (section: string): Visibility =>
    data.sectionVisibility[section] || "matches";
  const setVis = (section: string, v: Visibility) =>
    set(["sectionVisibility", section], v);

  const ALL_SECTIONS = [
    "gtky",
    "aura",
    "core",
    "signals",
    "qualities",
    "loops",
    "lessons",
    "aspirations",
    "dreamlog",
    "languages",
    "kinks",
    "archetypes",
    "attraction",
    "engagement",
    "dynamics",
    "repulsion",
    "viability",
    "seeking",
    "offering",
    "collaborations",
    "sizing",
    "faveth",
    "skills",
    "frames",



    "safety",
    "economic",
    "connection",
    "content",
    "glossary",
    "discovery",
  ];

  const setAllPublic = async () => {
    if (!user) return;
    const newVisibility = Object.fromEntries(
      ALL_SECTIONS.map((s) => [s, "public" as Visibility]),
    );
    const updatedData = { ...data, sectionVisibility: newVisibility };
    setData(updatedData);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, resonance_data: updatedData as any })
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to save visibility: " + error.message);
    } else {
      toast.success("All sections set to public!");
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background"
        >
          {/* Handle */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pt-3 pb-3 px-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Resonance Profile
                </h3>
                <p className="text-xs text-muted-foreground">
                  Define how you connect
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={setAllPublic}
                  className="rounded-full gradient-warm px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                  title="Set all sections to public visibility"
                >
                  🌍 Public
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full gradient-warm px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-full bg-secondary p-2"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="px-5 pb-8 mt-1">
              <Tabs defaultValue="foundations" className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-4 h-auto p-1">
                  <TabsTrigger
                    value="foundations"
                    className="text-xs px-1 py-2"
                  >
                    Foundations
                  </TabsTrigger>
                  <TabsTrigger value="attraction" className="text-xs px-1 py-2">
                    Attraction
                  </TabsTrigger>
                  <TabsTrigger value="dynamics" className="text-xs px-1 py-2">
                    Dynamics
                  </TabsTrigger>
                  <TabsTrigger value="seeking" className="text-xs px-1 py-2">
                    Seeking
                  </TabsTrigger>
                  <TabsTrigger value="meta" className="text-xs px-1 py-2">
                    Meta
                  </TabsTrigger>
                </TabsList>

                {/* ═══ TAB 1: FOUNDATIONS ═══ */}
                <TabsContent value="foundations" className="space-y-3">
                  {/* Get to Know Me */}
                  <EditorSection
                    icon="👤"
                    label="Get to Know Me"
                    description="Surface texture & anchors"
                    visibility={vis("gtky")}
                    onVisibilityChange={(v) => setVis("gtky", v)}
                  >
                    <TextField
                      label="Build"
                      value={data.getToKnowMe.build}
                      onChange={(v) => set(["getToKnowMe", "build"], v)}
                      placeholder="e.g. reads a lot, gym consistent"
                    />
                    <TextField
                      label="Current obsession"
                      value={data.getToKnowMe.currentObsession}
                      onChange={(v) =>
                        set(["getToKnowMe", "currentObsession"], v)
                      }
                    />
                    <TextField
                      label="Ideal weekend"
                      value={data.getToKnowMe.idealWeekend}
                      onChange={(v) => set(["getToKnowMe", "idealWeekend"], v)}
                    />
                    <TagField
                      label="Favorite media"
                      tags={data.getToKnowMe.favoriteMedia}
                      onChange={(v) => set(["getToKnowMe", "favoriteMedia"], v)}
                    />
                    <TagField
                      label="Favorite flowers"
                      tags={data.getToKnowMe.favoriteFlowers}
                      onChange={(v) =>
                        set(["getToKnowMe", "favoriteFlowers"], v)
                      }
                    />
                    <TagField
                      label="Date ideas"
                      tags={data.getToKnowMe.dateIdeas}
                      onChange={(v) => set(["getToKnowMe", "dateIdeas"], v)}
                    />

                  </EditorSection>

                  {/* Aura */}
                  <EditorSection
                    icon="🌀"
                    label="Aura"
                    description="How you land before context"
                    visibility={vis("aura")}
                    onVisibilityChange={(v) => setVis("aura", v)}
                  >
                    <TagField
                      label="Descriptors"
                      tags={data.aura.descriptors}
                      onChange={(v) => set(["aura", "descriptors"], v)}
                      placeholder="e.g. ominous, nerdy"
                    />
                    <TagField
                      label="Misread as"
                      tags={data.aura.misreadAs}
                      onChange={(v) => set(["aura", "misreadAs"], v)}
                      placeholder="e.g. intimidating, aloof"
                    />
                    <TagField
                      label="Reveals over time"
                      tags={data.aura.revealsOverTime}
                      onChange={(v) => set(["aura", "revealsOverTime"], v)}
                      placeholder="e.g. curious, warm"
                    />
                    <TextField
                      label="Tone tag"
                      value={data.aura.toneTag}
                      onChange={(v) => set(["aura", "toneTag"], v)}
                      placeholder="e.g. wavy scary, gentle nerd"
                    />
                  </EditorSection>

                  {/* Core Resonance — now uses flat activationVectors / flirtInterface */}
                  <EditorSection
                    icon="🎯"
                    label="Resonances"
                    description="Activation, flirt & signal"
                    defaultOpen
                    visibility={vis("core")}
                    onVisibilityChange={(v) => setVis("core", v)}
                  >
                    <TagField
                      label="✨ Activation vectors"
                      tags={data.activationVectors}
                      onChange={(v) => set(["activationVectors"], v)}
                      placeholder="e.g. competent weirdness, quiet warmth"
                    />
                    <TagField
                      label="💘 Flirt — attracts"
                      tags={data.flirtInterface.attracts}
                      onChange={(v) => set(["flirtInterface", "attracts"], v)}
                    />
                    <TagField
                      label="💔 Flirt — fails when"
                      tags={data.flirtInterface.failsWhen}
                      onChange={(v) => set(["flirtInterface", "failsWhen"], v)}
                    />
                  </EditorSection>

                  {/* Trust+Consumer (consumer) */}
                  <EditorSection
                    icon="🔎"
                    label="Trust"
                    description="Trust & distrust signals"
                    visibility={vis("signals")}
                    onVisibilityChange={(v) => setVis("signals", v)}
                  >
                    <TagField
                      label="🟢 Trust signals"
                      tags={data.consumer.trustSignals}
                      onChange={(v) => set(["consumer", "trustSignals"], v)}
                      placeholder="e.g. artifact built tools"
                    />
                    <TagField
                      label="🔴 Distrust signals"
                      tags={data.consumer.distrustSignals}
                      onChange={(v) => set(["consumer", "distrustSignals"], v)}
                      placeholder="e.g. over polished emptiness"
                    />
                  </EditorSection>

                  {/* Qualities & Introspections */}
                  <EditorSection
                    icon="✨"
                    label="Qualities"
                    description="Character traits & live introspections"
                    visibility={vis("qualities")}
                    onVisibilityChange={(v) => setVis("qualities", v)}
                  >
                    <TagField
                      label="Qualities"
                      tags={data.qualities}
                      onChange={(v) => set(["qualities"], v)}
                      placeholder="e.g. kind, curious, stubborn"
                    />
                    <ListField
                      label="Introspections"
                      items={data.introspections}
                      onChange={(v) => set(["introspections"], v)}
                      placeholder="A self-observation..."
                    />
                    <TagField
                      label="Values"
                      tags={data.values}
                      onChange={(v) => set(["values"], v)}
                      placeholder="e.g. sovereignty, competence, warmth"
                    />
                  </EditorSection>

                  {/* Loops */}
                  <EditorSection
                    icon="🔄"
                    label="Loops"
                    description="Recurring behavioral patterns"
                    visibility={vis("loops")}
                    onVisibilityChange={(v) => setVis("loops", v)}
                  >
                    <ListField
                      label="🔄 Behavioral loops"
                      items={data.loops}
                      onChange={(v) => set(["loops"], v)}
                      placeholder="A recurring pattern you've noticed..."
                    />
                  </EditorSection>

                  {/* Lessons */}
                  <EditorSection
                    icon="💡"
                    label="Lessons"
                    description="Hard-won wisdom"
                    visibility={vis("lessons")}
                    onVisibilityChange={(v) => setVis("lessons", v)}
                  >
                    <ListField
                      label="💡 Hard-won lessons"
                      items={data.lessons}
                      onChange={(v) => set(["lessons"], v)}
                      placeholder="Something you've learned the hard way..."
                    />
                  </EditorSection>

                  {/* Aspirations — waking dreams / life direction */}
                  <EditorSection
                    icon="🌅"
                    label="Aspirations"
                    description="What you want to build with the life you have"
                    visibility={vis("aspirations")}
                    onVisibilityChange={(v) => setVis("aspirations", v)}
                  >
                    <ListField
                      label="🌅 Waking dreams"
                      items={data.aspirations}
                      onChange={(v) => set(["aspirations"], v)}
                      placeholder="A future you'd actually walk toward..."
                    />
                  </EditorSection>

                  {/* Sleeping dreams — recorded dream stories */}
                  <EditorSection
                    icon="🌙"
                    label="Dream Log"
                    description="Stories your sleeping mind told you"
                    visibility={vis("dreamlog")}
                    onVisibilityChange={(v) => setVis("dreamlog", v)}
                  >
                    <ListField
                      label="🌙 Sleeping dreams"
                      items={data.sleepingDreams}
                      onChange={(v) => set(["sleepingDreams"], v)}
                      placeholder="A dream you remember..."
                    />
                  </EditorSection>

                  {/* Languages */}
                  <EditorSection
                    icon="💬"
                    label="Languages"
                    description="Expression & reception"
                    visibility={vis("languages")}
                    onVisibilityChange={(v) => setVis("languages", v)}
                  >
                    <TagField
                      label="Natural languages"
                      tags={data.languages.natural}
                      onChange={(v) => set(["languages", "natural"], v)}
                      placeholder="e.g. en, es, de"
                    />
                    <TagField
                      label="Receive love through"
                      tags={data.languages.receiveLoveThrough}
                      onChange={(v) =>
                        set(["languages", "receiveLoveThrough"], v)
                      }
                      placeholder="e.g. quality time"
                    />
                    <TagField
                      label="Express love through"
                      tags={data.languages.expressLoveThrough}
                      onChange={(v) =>
                        set(["languages", "expressLoveThrough"], v)
                      }
                      placeholder="e.g. acts of service"
                    />
                    <TextField
                      label="Communication style"
                      value={data.languages.communicationStyle}
                      onChange={(v) =>
                        set(["languages", "communicationStyle"], v)
                      }
                      placeholder="How you naturally communicate..."
                    />
                    <TagField
                      label="Creative expression"
                      tags={data.languages.creativeExpression}
                      onChange={(v) =>
                        set(["languages", "creativeExpression"], v)
                      }
                    />
                    <TextField
                      label="Vulnerability language"
                      value={data.languages.vulnerabilityLanguage}
                      onChange={(v) =>
                        set(["languages", "vulnerabilityLanguage"], v)
                      }
                      placeholder="How you show vulnerability..."
                    />
                  </EditorSection>

                  {/* Desires — list of composite entries; each has label + 5 facets */}
                  <EditorSection
                    icon="🔥"
                    label="Desires"
                    description="Each desire is one thing with many facets"
                    visibility={vis("kinks")}
                    onVisibilityChange={(v) => setVis("kinks", v)}
                  >
                    <div className="space-y-4">
                      {data.desires.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No desires added yet. Each entry captures one desire across intellectual, relational, intensity, play, and avoid facets.
                        </p>
                      )}
                      {data.desires.map((desire, di) => (
                        <div
                          key={di}
                          className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={desire.label}
                              onChange={(e) =>
                                set(["desires", String(di), "label"], e.target.value)
                              }
                              placeholder="Name this desire (e.g. 'with a partner', 'clowning', 'solo creative')"
                              className={inputClass + " flex-1"}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                set(
                                  ["desires"],
                                  data.desires.filter((_, i) => i !== di),
                                )
                              }
                              className="rounded-full p-1.5 hover:bg-destructive/20 transition-all flex-shrink-0"
                              aria-label="Remove desire"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                          <ListField
                            label="Intellectual"
                            items={desire.intellectual}
                            onChange={(v) => set(["desires", String(di), "intellectual"], v)}
                            placeholder="What stimulates the mind here..."
                          />
                          <ListField
                            label="Relational"
                            items={desire.relational}
                            onChange={(v) => set(["desires", String(di), "relational"], v)}
                            placeholder="What connection looks like here..."
                          />
                          <ListField
                            label="Intensity"
                            items={desire.intensity}
                            onChange={(v) => set(["desires", String(di), "intensity"], v)}
                            placeholder="Add an intensity note..."
                          />
                          <ListField
                            label="Play"
                            items={desire.play}
                            onChange={(v) => set(["desires", String(di), "play"], v)}
                            placeholder="Add a play mode..."
                          />
                          <ListField
                            label="Avoids"
                            items={desire.avoid}
                            onChange={(v) => set(["desires", String(di), "avoid"], v)}
                            placeholder="Add something to avoid..."
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            ["desires"],
                            [
                              ...data.desires,
                              { label: "", intellectual: [], relational: [], intensity: [], play: [], avoid: [] },
                            ],
                          )
                        }
                        className="w-full text-xs font-medium py-2 rounded-md border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                      >
                        + Add desire
                      </button>
                    </div>
                  </EditorSection>
                </TabsContent>

                {/* ═══ TAB 2: ATTRACTION ═══ */}
                <TabsContent value="attraction" className="space-y-3">
                  {/* Archetypes — v0.9: name/definition/activationContext */}
                  <EditorSection
                    icon="🎭"
                    label="Archetypes"
                    description="Who you are by context"
                    defaultOpen
                    visibility={vis("archetypes")}
                    onVisibilityChange={(v) => setVis("archetypes", v)}
                  >
                    {data.archetypes.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {data.archetypes.map((arch, i) => (
                          <div
                            key={arch.name + i}
                            className="rounded-xl bg-secondary/50 p-3 flex items-start justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {arch.name}
                              </p>
                              {arch.definition && (
                                <p className="text-xs text-muted-foreground">
                                  {arch.definition}
                                </p>
                              )}
                              {arch.activationContext && (
                                <p className="text-xs text-primary/70 mt-0.5">
                                  → {arch.activationContext}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                set(
                                  ["archetypes"],
                                  data.archetypes.filter((_, idx) => idx !== i),
                                )
                              }
                              className="opacity-0 group-hover:opacity-100 rounded-full p-1 hover:bg-destructive/20 transition-all"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <CustomArchetypeCreator
                      onAdd={(arch: any) =>
                        set(["archetypes"], [...data.archetypes, arch])
                      }
                    />
                  </EditorSection>

                  {/* Aesthetics */}
                  <EditorSection
                    icon="🎨"
                    label="Aesthetics"
                    description="How you present"
                    visibility={vis("aura")}
                    onVisibilityChange={(v) => setVis("aura", v)}
                  >
                    <TagField
                      label="Aesthetic tags"
                      tags={data.aesthetics}
                      onChange={(v) => set(["aesthetics"], v)}
                      placeholder="e.g. workwear, minimal polish"
                    />
                  </EditorSection>

                  {/* Attraction Gradient */}
                  <EditorSection
                    icon="🧲"
                    label="Attraction Gradient"
                    description="What draws you in"
                    visibility={vis("attraction")}
                    onVisibilityChange={(v) => setVis("attraction", v)}
                  >
                    <div className="flex gap-4">
                      <ToggleButton
                        label="Slow Burn"
                        value={data.attraction.slowBurn}
                        onChange={(v) => set(["attraction", "slowBurn"], v)}
                      />
                      <ToggleButton
                        label="Fast Hook"
                        value={data.attraction.fastHook}
                        onChange={(v) => set(["attraction", "fastHook"], v)}
                      />
                    </div>
                    <TagField
                      label="What draws you in"
                      tags={data.attraction.whatDrawsIn}
                      onChange={(v) => set(["attraction", "whatDrawsIn"], v)}
                      placeholder="e.g. quiet competence, dry humor"
                    />
                    <TextField
                      label="Timeline"
                      value={data.attraction.timeline}
                      onChange={(v) => set(["attraction", "timeline"], v)}
                      placeholder="How long it takes you to feel it..."
                    />
                  </EditorSection>

                  {/* Engagement Curve */}
                  <EditorSection
                    icon="📈"
                    label="Engagement Curve"
                    description="How connection develops"
                    visibility={vis("engagement")}
                    onVisibilityChange={(v) => setVis("engagement", v)}
                  >
                    <TextField
                      label="Phase 1 — Initial contact"
                      value={data.engagement.phase1}
                      onChange={(v) => set(["engagement", "phase1"], v)}
                      placeholder="How you show up at first..."
                      multiline
                    />
                    <TextField
                      label="Phase 2 — Building"
                      value={data.engagement.phase2}
                      onChange={(v) => set(["engagement", "phase2"], v)}
                      placeholder="How connection deepens..."
                      multiline
                    />
                    <TextField
                      label="Phase 3 — Established"
                      value={data.engagement.phase3}
                      onChange={(v) => set(["engagement", "phase3"], v)}
                      placeholder="What sustained connection looks like..."
                      multiline
                    />
                    <TextField
                      label="Cooperation style"
                      value={data.engagement.cooperationStyle}
                      onChange={(v) =>
                        set(["engagement", "cooperationStyle"], v)
                      }
                      placeholder="How you collaborate..."
                    />
                  </EditorSection>
                </TabsContent>

                {/* ═══ TAB 3: DYNAMICS ═══ */}
                <TabsContent value="dynamics" className="space-y-3">
                  {/* Repulsion Vectors — top-level flat array + structured */}
                  <EditorSection
                    icon="🚧"
                    label="Repulsion Vectors"
                    description="Hard stops & flags"
                    defaultOpen
                    visibility={vis("repulsion")}
                    onVisibilityChange={(v) => setVis("repulsion", v)}
                  >
                    <TagField
                      label="🚫 Top-level repulsion"
                      tags={data.repulsionVectors}
                      onChange={(v) => set(["repulsionVectors"], v)}
                      placeholder="e.g. extractive attention, performative intensity"
                    />
                    <TagField
                      label="🛑 Hard stops"
                      tags={data.repulsion.hardStops}
                      onChange={(v) => set(["repulsion", "hardStops"], v)}
                      placeholder="Absolute deal-breakers..."
                    />
                    <TagField
                      label="⚠️ Yellow flags"
                      tags={data.repulsion.yellowFlags}
                      onChange={(v) => set(["repulsion", "yellowFlags"], v)}
                      placeholder="Concerns worth watching..."
                    />
                    <TagField
                      label="🔍 Pattern concerns"
                      tags={data.repulsion.patternConcerns}
                      onChange={(v) => set(["repulsion", "patternConcerns"], v)}
                      placeholder="Recurring red flags..."
                    />
                  </EditorSection>

                  {/* Power Exchange */}
                  <EditorSection
                    icon="⚔️"
                    label="Power Exchange"
                    description="Power dynamics in connection"
                    visibility={vis("dynamics")}
                    onVisibilityChange={(v) => setVis("dynamics", v)}
                  >
                    <ToggleButton
                      label="Power dynamics enabled"
                      value={data.powerDynamics.enabled}
                      onChange={(v) => set(["powerDynamics", "enabled"], v)}
                    />
                    {data.powerDynamics.enabled && (
                      <>
                        <CheckboxGroup
                          label="Expression modes"
                          options={EXPRESSION_MODES}
                          selected={data.powerDynamics.expressionModes}
                          onChange={(v) =>
                            set(["powerDynamics", "expressionModes"], v)
                          }
                        />
                        <TextField
                          label="Exploration"
                          value={data.powerDynamics.exploration}
                          onChange={(v) =>
                            set(["powerDynamics", "exploration"], v)
                          }
                          placeholder="How you explore power dynamics..."
                          multiline
                        />
                      </>
                    )}
                  </EditorSection>

                  {/* Play Preferences */}
                  <EditorSection
                    icon="🎲"
                    label="Play Preferences"
                    description="Mode & intensity"
                    visibility={vis("dynamics")}
                    onVisibilityChange={(v) => setVis("dynamics", v)}
                  >
                    <TextField
                      label="Play mode"
                      value={data.playPreferences.mode}
                      onChange={(v) => set(["playPreferences", "mode"], v)}
                      placeholder="How you play — light, ritualistic, improvisational, meta..."
                    />
                    <SliderField
                      label="Emotional intensity"
                      value={data.playPreferences.intensityProfile.emotional}
                      onChange={(v) =>
                        set(
                          ["playPreferences", "intensityProfile", "emotional"],
                          v,
                        )
                      }
                    />
                    <SliderField
                      label="Theatrical intensity"
                      value={data.playPreferences.intensityProfile.theatrical}
                      onChange={(v) =>
                        set(
                          ["playPreferences", "intensityProfile", "theatrical"],
                          v,
                        )
                      }
                    />
                    <SliderField
                      label="Intellectual intensity"
                      value={data.playPreferences.intensityProfile.intellectual}
                      onChange={(v) =>
                        set(
                          [
                            "playPreferences",
                            "intensityProfile",
                            "intellectual",
                          ],
                          v,
                        )
                      }
                    />
                  </EditorSection>
                </TabsContent>

                {/* ═══ TAB 4: SEEKING & SAFETY ═══ */}
                <TabsContent value="seeking" className="space-y-3">
                  {/* Seeking — v0.9 format */}
                  <EditorSection
                    icon="🧭"
                    label="Seeking"
                    description="What you're looking for"
                    defaultOpen
                    visibility={vis("seeking")}
                    onVisibilityChange={(v) => setVis("seeking", v)}
                  >
                    <ToggleButton
                      label="Actively seeking"
                      value={data.seeking.active}
                      onChange={(v) => set(["seeking", "active"], v)}
                    />
                    <TagField
                      label="Seeking archetypes"
                      tags={data.seeking.archetypes}
                      onChange={(v) => set(["seeking", "archetypes"], v)}
                      placeholder="e.g. grounded curiosity with self-direction"
                    />
                    <TagField
                      label="Seeking aesthetics"
                      tags={data.seeking.aesthetics}
                      onChange={(v) => set(["seeking", "aesthetics"], v)}
                    />
                    <TagField
                      label="Compatible languages"
                      tags={data.seeking.languages.compatibleWith}
                      onChange={(v) =>
                        set(["seeking", "languages", "compatibleWith"], v)
                      }
                    />
                    <TextField
                      label="Mismatch tolerance"
                      value={data.seeking.languages.mismatchTolerance}
                      onChange={(v) =>
                        set(["seeking", "languages", "mismatchTolerance"], v)
                      }
                      placeholder="e.g. low for chaos, high for difference"
                    />
                    <TagField
                      label="Seeking qualities"
                      tags={data.seeking.qualities}
                      onChange={(v) => set(["seeking", "qualities"], v)}
                    />
                    <TagField
                      label="Intents"
                      tags={data.seeking.intents}
                      onChange={(v) => set(["seeking", "intents"], v)}
                    />
                    <TagField
                      label="Seeking kinks"
                      tags={data.seeking.kinks}
                      onChange={(v) => set(["seeking", "kinks"], v)}
                    />
                    <TagField
                      label="Non-negotiables"
                      tags={data.seeking.nonNegotiables}
                      onChange={(v) => set(["seeking", "nonNegotiables"], v)}
                      placeholder="What you require..."
                    />
                    <TagField
                      label="Nice to haves"
                      tags={data.seeking.niceToHaves}
                      onChange={(v) => set(["seeking", "niceToHaves"], v)}
                    />
                  </EditorSection>

                  {/* Offering — roles you're open to playing */}
                  <EditorSection
                    icon="🎭"
                    label="Offering"
                    description="Roles/postures you're open to playing for someone"
                    visibility={vis("offering")}
                    onVisibilityChange={(v) => setVis("offering", v)}
                  >
                    <TagField
                      label="Roles I'm open to"
                      tags={data.offering.roles}
                      onChange={(v) => set(["offering", "roles"], v)}
                      placeholder="e.g. maid, passenger princess, rigger, jester, piggyback rider"
                    />
                    <TextField
                      label="Notes"
                      value={data.offering.notes}
                      onChange={(v) => set(["offering", "notes"], v)}
                      placeholder="Context, conditions, what this looks like for you..."
                      multiline
                    />
                  </EditorSection>

                  {/* Sizing — clothing/dress-up */}
                  <EditorSection
                    icon="👗"
                    label="Sizing"
                    description="Clothing sizes for dress-up, gifts, costumes — private by default"
                    visibility={vis("sizing")}
                    onVisibilityChange={(v) => setVis("sizing", v)}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <TextField label="Shirt / Top" value={data.sizing.shirt} onChange={(v) => set(["sizing", "shirt"], v)} placeholder="M, US 8, EU 38..." />
                      <TextField label="Pants" value={data.sizing.pants} onChange={(v) => set(["sizing", "pants"], v)} placeholder="32x30, US 8..." />
                      <TextField label="Dress" value={data.sizing.dress} onChange={(v) => set(["sizing", "dress"], v)} placeholder="US 6, EU 36..." />
                      <TextField label="Shoe" value={data.sizing.shoe} onChange={(v) => set(["sizing", "shoe"], v)} placeholder="US 10, EU 43..." />
                      <TextField label="Bra" value={data.sizing.bra} onChange={(v) => set(["sizing", "bra"], v)} placeholder="34C..." />
                      <TextField label="Ring" value={data.sizing.ring} onChange={(v) => set(["sizing", "ring"], v)} placeholder="US 7..." />
                      <TextField label="Hat" value={data.sizing.hat} onChange={(v) => set(["sizing", "hat"], v)} placeholder="7 1/4, 58cm..." />
                      <TextField label="Gloves" value={data.sizing.gloves} onChange={(v) => set(["sizing", "gloves"], v)} placeholder="M, L..." />
                      <TextField label="Waist" value={data.sizing.waist} onChange={(v) => set(["sizing", "waist"], v)} placeholder="32in / 81cm" />
                      <TextField label="Inseam" value={data.sizing.inseam} onChange={(v) => set(["sizing", "inseam"], v)} placeholder="30in / 76cm" />
                      <TextField label="Height" value={data.sizing.height} onChange={(v) => set(["sizing", "height"], v)} placeholder="5'10 / 178cm" />
                    </div>
                    <TextField
                      label="Notes"
                      value={data.sizing.notes}
                      onChange={(v) => set(["sizing", "notes"], v)}
                      placeholder="Fit preferences, brands that fit well, anything to know..."
                      multiline
                    />
                  </EditorSection>

                  {/* Frames — identity systems */}
                  <EditorSection
                    icon="🔮"
                    label="Identity Frames"
                    description="Astrology, MBTI, Enneagram, and other systems people use to describe themselves"
                    visibility={vis("frames")}
                    onVisibilityChange={(v) => setVis("frames", v)}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Astrology</p>
                        <div className="grid grid-cols-3 gap-3">
                          <TextField label="Sun" value={data.frames.astrology.sun} onChange={(v) => set(["frames","astrology","sun"], v)} placeholder="Aquarius" />
                          <TextField label="Moon" value={data.frames.astrology.moon} onChange={(v) => set(["frames","astrology","moon"], v)} placeholder="Pisces" />
                          <TextField label="Rising" value={data.frames.astrology.rising} onChange={(v) => set(["frames","astrology","rising"], v)} placeholder="Scorpio" />
                        </div>
                        <TextField label="Notes" value={data.frames.astrology.notes} onChange={(v) => set(["frames","astrology","notes"], v)} placeholder="Chart quirks, how much you buy it, etc." multiline />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">MBTI</p>
                        <div className="grid grid-cols-2 gap-3">
                          <TextField label="Type" value={data.frames.mbti.type} onChange={(v) => set(["frames","mbti","type"], v)} placeholder="INFP, ENTJ..." />
                          <TextField label="Notes" value={data.frames.mbti.notes} onChange={(v) => set(["frames","mbti","notes"], v)} placeholder="How it shows up" />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Enneagram</p>
                        <div className="grid grid-cols-3 gap-3">
                          <TextField label="Type" value={data.frames.enneagram.type} onChange={(v) => set(["frames","enneagram","type"], v)} placeholder="4, 5, 7..." />
                          <TextField label="Wing" value={data.frames.enneagram.wing} onChange={(v) => set(["frames","enneagram","wing"], v)} placeholder="4w5" />
                          <TextField label="Stack" value={data.frames.enneagram.stack} onChange={(v) => set(["frames","enneagram","stack"], v)} placeholder="sp/sx" />
                        </div>
                        <TextField label="Notes" value={data.frames.enneagram.notes} onChange={(v) => set(["frames","enneagram","notes"], v)} placeholder="Growth line, core wound, etc." multiline />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Custom systems</p>
                        <p className="text-xs text-muted-foreground mb-2">Human Design, HSP, chronotype, D&D alignment, love languages — anything</p>
                        <div className="space-y-2">
                          {data.frames.custom.map((f, i) => (
                            <div key={i} className="rounded-xl bg-secondary/40 p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <TextField label="System" value={f.system} onChange={(v) => {
                                  const next = [...data.frames.custom];
                                  next[i] = { ...next[i], system: v };
                                  set(["frames","custom"], next);
                                }} placeholder="Human Design" />
                                <TextField label="Value" value={f.value} onChange={(v) => {
                                  const next = [...data.frames.custom];
                                  next[i] = { ...next[i], value: v };
                                  set(["frames","custom"], next);
                                }} placeholder="Manifesting Generator" />
                              </div>
                              <TextField label="Notes" value={f.notes} onChange={(v) => {
                                const next = [...data.frames.custom];
                                next[i] = { ...next[i], notes: v };
                                set(["frames","custom"], next);
                              }} placeholder="Optional" />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = data.frames.custom.filter((_, j) => j !== i);
                                  set(["frames","custom"], next);
                                }}
                                className="text-xs text-destructive hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => set(["frames","custom"], [...data.frames.custom, { system: "", value: "", notes: "" }])}
                            className="w-full rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
                          >
                            + Add a system
                          </button>
                        </div>
                      </div>
                    </div>
                  </EditorSection>



                  {/* Collaborations — specific partnership types */}
                  <EditorSection
                    icon="🤝"
                    label="Collaborations"
                    description="Bands, builds, projects you want partners for"
                    visibility={vis("collaborations")}
                    onVisibilityChange={(v) => setVis("collaborations", v)}
                  >
                    <CollaborationsField
                      items={data.collaborations}
                      onChange={(v) => set(["collaborations"], v)}
                    />
                  </EditorSection>



                  {/* Safety + Trust */}
                  <EditorSection
                    icon="🛡️"
                    label="Safety & Consent"
                    description="Consent, boundaries & accountability"
                    visibility={vis("safety")}
                    onVisibilityChange={(v) => setVis("safety", v)}
                  >
                    <TagField
                      label="Consent frameworks"
                      tags={data.safety.consentFrameworks}
                      onChange={(v) => set(["safety", "consentFrameworks"], v)}
                      placeholder="e.g. explicit yes, ongoing check-ins"
                    />
                    <TagField
                      label="Hard boundaries"
                      tags={data.safety.hardBoundaries}
                      onChange={(v) => set(["safety", "hardBoundaries"], v)}
                    />
                    <TagField
                      label="Accountability"
                      tags={data.safety.accountability}
                      onChange={(v) => set(["safety", "accountability"], v)}
                    />
                    <TextField
                      label="Safe sex practices"
                      value={data.safety.safeSexPractices}
                      onChange={(v) => set(["safety", "safeSexPractices"], v)}
                    />
                    <TextField
                      label="Substance clarity"
                      value={data.safety.substanceClarity}
                      onChange={(v) => set(["safety", "substanceClarity"], v)}
                    />
                    <TextField
                      label="Harm history"
                      value={data.safety.harmHistory}
                      onChange={(v) => set(["safety", "harmHistory"], v)}
                      placeholder="Anything to disclose about past harm..."
                      multiline
                    />
                    <ToggleButton
                      label="References available"
                      value={data.safety.referencesAvailable}
                      onChange={(v) =>
                        set(["safety", "referencesAvailable"], v)
                      }
                    />
                  </EditorSection>
                </TabsContent>

                {/* ═══ TAB 5: META ═══ */}
                <TabsContent value="meta" className="space-y-3">
                  {/* Availability & Rhythm */}
                  <EditorSection
                    icon="🌱"
                    label="Availability & Rhythm"
                    description="Season, capacity & how you show up"
                    defaultOpen
                    visibility={vis("viability")}
                    onVisibilityChange={(v) => setVis("viability", v)}
                  >
                    <TextField
                      label="Current season"
                      value={data.viability.availability.currentSeason}
                      onChange={(v) =>
                        set(["viability", "availability", "currentSeason"], v)
                      }
                      placeholder="e.g. available and seeking, but still building"
                    />
                    <TextField
                      label="Weekly hours"
                      value={data.viability.availability.weeklyHours}
                      onChange={(v) =>
                        set(["viability", "availability", "weeklyHours"], v)
                      }
                      placeholder="e.g. 5-10"
                    />
                    <TextField
                      label="Timezone"
                      value={data.viability.availability.timezone}
                      onChange={(v) =>
                        set(["viability", "availability", "timezone"], v)
                      }
                      placeholder="e.g. US/Pacific"
                    />
                    <ToggleButton
                      label="Async preferred"
                      value={data.viability.availability.asyncPreferred}
                      onChange={(v) =>
                        set(["viability", "availability", "asyncPreferred"], v)
                      }
                    />
                    <TagField
                      label="Relationship types available"
                      tags={data.viability.relationshipTypesAvailable}
                      onChange={(v) =>
                        set(["viability", "relationshipTypesAvailable"], v)
                      }
                      placeholder="e.g. romantic, creative collaboration"
                    />
                    <TextField
                      label="Conflict style"
                      value={data.conflictStyle}
                      onChange={(v) => set(["conflictStyle"], v)}
                      placeholder="e.g. clarify pattern then address"
                    />
                    <TextField
                      label="Reciprocity model"
                      value={data.reciprocityModel}
                      onChange={(v) => set(["reciprocityModel"], v)}
                      placeholder="e.g. evolving toward sovereignty"
                    />
                    <TagField
                      label="Growth vectors"
                      tags={data.growthVectors}
                      onChange={(v) => set(["growthVectors"], v)}
                      placeholder="e.g. deepening craft"
                    />
                  </EditorSection>

                  {/* Economic */}
                  <EditorSection
                    icon="💎"
                    label="Economic"
                    description="Labor & exchange"
                    visibility={vis("economic")}
                    onVisibilityChange={(v) => setVis("economic", v)}
                  >
                    <ToggleButton
                      label="Open to invoicing"
                      value={data.economic.openToInvoicing}
                      onChange={(v) => set(["economic", "openToInvoicing"], v)}
                    />
                    <TagField
                      label="Contexts"
                      tags={data.economic.contexts}
                      onChange={(v) => set(["economic", "contexts"], v)}
                      placeholder="e.g. creative collaboration"
                    />
                    <TagField
                      label="Principles"
                      tags={data.economic.principles}
                      onChange={(v) => set(["economic", "principles"], v)}
                      placeholder="e.g. sovereignty over dependency"
                    />
                    <TagField
                      label="Limits"
                      tags={data.economic.limits}
                      onChange={(v) => set(["economic", "limits"], v)}
                      placeholder="e.g. no uncompensated extractive labor"
                    />
                    <TagField
                      label="Kink alignment"
                      tags={data.economic.kinkAlignment}
                      onChange={(v) => set(["economic", "kinkAlignment"], v)}
                      placeholder="e.g. financial asymmetry as play"
                    />
                  </EditorSection>

                  {/* Connection */}
                  <EditorSection
                    icon="📡"
                    label="Connection"
                    description="Logistics & preferences"
                    visibility={vis("connection")}
                    onVisibilityChange={(v) => setVis("connection", v)}
                  >
                    <TextField
                      label="Primary channel"
                      value={data.connection.channelPrimary}
                      onChange={(v) => set(["connection", "channelPrimary"], v)}
                      placeholder="e.g. async voice text"
                    />
                    <TextField
                      label="Secondary channel"
                      value={data.connection.channelSecondary}
                      onChange={(v) =>
                        set(["connection", "channelSecondary"], v)
                      }
                      placeholder="e.g. voice calls"
                    />
                    <TextField
                      label="Contact etiquette"
                      value={data.connection.contactEtiquette}
                      onChange={(v) =>
                        set(["connection", "contactEtiquette"], v)
                      }
                      placeholder="e.g. text first then call"
                    />
                    <TextField
                      label="Response time"
                      value={data.connection.responseTimeExpectations}
                      onChange={(v) =>
                        set(["connection", "responseTimeExpectations"], v)
                      }
                      placeholder="e.g. 24-48 hours"
                    />
                    <TextField
                      label="Frequency"
                      value={data.connection.frequencyOfContact}
                      onChange={(v) =>
                        set(["connection", "frequencyOfContact"], v)
                      }
                      placeholder="e.g. daily async or less frequent sync"
                    />
                    <TextField
                      label="Meeting modality"
                      value={data.connection.meetingModality}
                      onChange={(v) =>
                        set(["connection", "meetingModality"], v)
                      }
                      placeholder="e.g. hybrid"
                    />
                    <TextField
                      label="Location"
                      value={data.connection.location}
                      onChange={(v) => set(["connection", "location"], v)}
                      placeholder="e.g. remote ok"
                    />
                    <TextField
                      label="Willing to travel"
                      value={data.connection.willingToTravel}
                      onChange={(v) =>
                        set(["connection", "willingToTravel"], v)
                      }
                      placeholder="e.g. yes"
                    />
                  </EditorSection>

                  {/* Content */}
                  <EditorSection
                    icon="📺"
                    label="Content"
                    description="What you make"
                    visibility={vis("content")}
                    onVisibilityChange={(v) => setVis("content", v)}
                  >
                    <TagField
                      label="Categories"
                      tags={data.content.categories}
                      onChange={(v) => set(["content", "categories"], v)}
                      placeholder="e.g. software, music"
                    />
                    <TagField
                      label="Style"
                      tags={data.content.style}
                      onChange={(v) => set(["content", "style"], v)}
                      placeholder="e.g. slow build, artifact oriented"
                    />
                  </EditorSection>

                  {/* Discovery */}
                  <EditorSection
                    icon="🔭"
                    label="Discovery"
                    description="How you want to be found"
                    visibility={vis("discovery")}
                    onVisibilityChange={(v) => setVis("discovery", v)}
                  >
                    <TextField
                      label="Visibility"
                      value={data.discovery.visibility}
                      onChange={(v) => set(["discovery", "visibility"], v)}
                      placeholder="e.g. artifact first identity second"
                    />
                    <TextField
                      label="Content rating"
                      value={data.discovery.contentRating}
                      onChange={(v) => set(["discovery", "contentRating"], v)}
                      placeholder="e.g. mature"
                    />
                    <TextField
                      label="Written bio"
                      value={data.discovery.introduction.writtenBio}
                      onChange={(v) =>
                        set(["discovery", "introduction", "writtenBio"], v)
                      }
                      placeholder="Your intro..."
                      multiline
                    />
                    <PlatformsField
                      platforms={data.discovery.platforms}
                      onChange={(v) => set(["discovery", "platforms"], v)}
                    />
                  </EditorSection>

                  {/* Glossary */}
                  <EditorSection
                    icon="📖"
                    label="Glossary"
                    description="Your personal lexicon"
                    visibility={vis("glossary")}
                    onVisibilityChange={(v) => setVis("glossary", v)}
                  >
                    <GlossaryField
                      glossary={data.glossary}
                      onChange={(v) => set(["glossary"], v)}
                    />
                  </EditorSection>

                  {/* Aliases */}
                  <EditorSection
                    icon="🏷️"
                    label="Aliases"
                    description="Other names you go by"
                    visibility={vis("aura")}
                    onVisibilityChange={(v) => setVis("aura", v)}
                  >
                    <TagField
                      label="Aliases"
                      tags={data.aliases}
                      onChange={(v) => set(["aliases"], v)}
                      placeholder="e.g. baon, instance.select"
                    />
                  </EditorSection>
                </TabsContent>
              </Tabs>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-6 w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving…" : "Save resonance profile"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResonanceEditor;
