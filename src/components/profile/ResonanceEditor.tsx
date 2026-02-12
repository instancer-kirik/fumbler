import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, X, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RESONANCE_SECTIONS } from "@/data/resonance-profile";

// ─── Types ───────────────────────────────────────────────────────────────────

type Visibility = "public" | "matches" | "express";

interface SectionVisibility {
  [sectionId: string]: Visibility;
}

interface ConsumerData {
  trustSignals: string[];
  distrustSignals: string[];
}

interface GlossaryEntry {
  meaning: string;
  state: string;
}

interface EconomicData {
  openToInvoicing: boolean;
  contexts: string[];
  rates: Record<string, string>;
  values: string[];
  boundaries: string[];
  kinkAlignment: string[];
}

interface DiscoveryData {
  visibility: string;
  seekingStatus: string;
  privacyComfortLevel: string;
  willingToBeCompared: boolean;
  portfolioLinks: string[];
  writtenBio: string;
}

interface ResonanceData {
  core: {
    attentionModel: string;
    activationVectors: { attracts: string[]; repels: string[] };
    flirtInterface: { attracts: string[]; failsWhen: string[] };
  };
  consumer: ConsumerData;
  viability: {
    currentSeason: string;
    engagementFrequency: string;
    weeklyHours: string;
    conflictStyle: string;
    reciprocityModel: string;
    relationshipTypes: string[];
    coreValues: string[];
    growthVectors: string[];
  };
  experiential: {
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
  };
  seeking: {
    activelySeeking: boolean;
    seekingArchetype: string;
    seekingLoops: string;
    seekingLessons: string;
    seekingKinks: string[];
    nonNegotiables: string[];
    niceToHaves: string[];
  };
  safety: {
    consentFrameworks: string[];
    hardBoundaries: string[];
    accountability: string[];
    safeSexPractices: string;
    substanceClarity: string;
  };
  economic: EconomicData;
  connection: {
    preferredContactMethod: string;
    responseTimeExpectations: string;
    frequencyOfContact: string;
    meetingModality: string;
    location: string;
    willingToTravel: string;
  };
  glossary: Record<string, GlossaryEntry>;
  discovery: DiscoveryData;
  sectionVisibility: SectionVisibility;
}

const emptyData: ResonanceData = {
  core: {
    attentionModel: "",
    activationVectors: { attracts: [], repels: [] },
    flirtInterface: { attracts: [], failsWhen: [] },
  },
  viability: {
    currentSeason: "exploring",
    engagementFrequency: "weekly",
    weeklyHours: "",
    conflictStyle: "dialogue",
    reciprocityModel: "flexible",
    relationshipTypes: [],
    coreValues: [],
    growthVectors: [],
  },
  experiential: {
    loops: [],
    lessons: [],
    languages: {
      receiveLoveThrough: [],
      expressLoveThrough: [],
      communicationStyle: "",
      creativeExpression: [],
      vulnerabilityLanguage: "",
    },
    kinks: { intellectual: "", relational: "", intensity: "", play: "", avoid: "" },
    type: { archetype: "", attractionPattern: "", roleInRelationship: "", recurringPattern: "" },
  },
  seeking: {
    activelySeeking: true,
    seekingArchetype: "",
    seekingLoops: "",
    seekingLessons: "",
    seekingKinks: [],
    nonNegotiables: [],
    niceToHaves: [],
  },
  safety: {
    consentFrameworks: [],
    hardBoundaries: [],
    accountability: [],
    safeSexPractices: "",
    substanceClarity: "",
  },
  consumer: {
    trustSignals: [],
    distrustSignals: [],
  },
  economic: {
    openToInvoicing: false,
    contexts: [],
    rates: {},
    values: [],
    boundaries: [],
    kinkAlignment: [],
  },
  connection: {
    preferredContactMethod: "",
    responseTimeExpectations: "",
    frequencyOfContact: "",
    meetingModality: "hybrid",
    location: "",
    willingToTravel: "",
  },
  glossary: {},
  discovery: {
    visibility: "authenticated",
    seekingStatus: "actively_looking",
    privacyComfortLevel: "medium",
    willingToBeCompared: false,
    portfolioLinks: [],
    writtenBio: "",
  },
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
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
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
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
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
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
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

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ─── Visibility toggle ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] = [
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
      onChange({ ...glossary, [key]: { meaning: meaning.trim(), state: state.trim() } });
      setTerm("");
      setMeaning("");
      setState("");
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">Personal lexicon</label>
      <div className="space-y-2 mb-3">
        {Object.entries(glossary).map(([key, entry]) => (
          <div key={key} className="rounded-xl bg-secondary/50 p-3 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{key.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{entry.meaning}</p>
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
        <input type="text" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Term (e.g. leethia)" className={inputClass} />
        <input type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Meaning..." className={inputClass} />
        <div className="flex gap-2">
          <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State (optional)" className={inputClass} />
          <button type="button" onClick={addEntry} className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
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

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">{label}</p>
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
            <div className="px-4 pb-4 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
        .single()
        .then(({ data: profile }) => {
          if (profile?.resonance_data) {
            setData({ ...emptyData, ...(profile.resonance_data as any) });
          }
          setLoading(false);
        });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ resonance_data: data as any })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Resonance profile saved!");
      onOpenChange(false);
    }
  };

  // Helper to update nested paths
  const set = <T,>(path: string[], value: T) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const vis = (section: string): Visibility => data.sectionVisibility[section] || "matches";
  const setVis = (section: string, v: Visibility) =>
    set(["sectionVisibility", section], v);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
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
                <h3 className="font-display text-xl font-bold text-foreground">Resonance Profile</h3>
                <p className="text-xs text-muted-foreground">Define how you connect</p>
              </div>
              <div className="flex gap-2">
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
            <div className="px-5 pb-8 space-y-3 mt-1">
              {/* Core */}
              <EditorSection icon="🎯" label="Core Resonance" description="How you engage" defaultOpen visibility={vis("core")} onVisibilityChange={(v) => setVis("core", v)}>
                <TextField
                  label="Attention Model"
                  value={data.core.attentionModel}
                  onChange={(v) => set(["core", "attentionModel"], v)}
                  placeholder="How you give and receive attention..."
                />
                <TagField
                  label="✨ What activates you"
                  tags={data.core.activationVectors.attracts}
                  onChange={(v) => set(["core", "activationVectors", "attracts"], v)}
                  placeholder="e.g. genuine humor"
                />
                <TagField
                  label="🚫 What repels you"
                  tags={data.core.activationVectors.repels}
                  onChange={(v) => set(["core", "activationVectors", "repels"], v)}
                  placeholder="e.g. performative confidence"
                />
                <TagField
                  label="💘 Flirt style — attracts"
                  tags={data.core.flirtInterface.attracts}
                  onChange={(v) => set(["core", "flirtInterface", "attracts"], v)}
                />
                <TagField
                  label="💔 Flirt style — fails when"
                  tags={data.core.flirtInterface.failsWhen}
                  onChange={(v) => set(["core", "flirtInterface", "failsWhen"], v)}
                />
              </EditorSection>

              {/* Consumer Interface — The Compendium */}
              <EditorSection icon="🔎" label="Consumer Interface" description="What works on you — your compendium" visibility={vis("consumer")} onVisibilityChange={(v) => setVis("consumer", v)}>
                <TagField
                  label="🟢 Trust signals"
                  tags={data.consumer.trustSignals}
                  onChange={(v) => set(["consumer", "trustSignals"], v)}
                  placeholder="e.g. artifact_built_tools"
                />
                <TagField
                  label="🔴 Distrust signals"
                  tags={data.consumer.distrustSignals}
                  onChange={(v) => set(["consumer", "distrustSignals"], v)}
                  placeholder="e.g. over_polished_emptiness"
                />
              </EditorSection>

              {/* Loops & Lessons */}
              <EditorSection icon="🔄" label="Loops & Lessons" description="Patterns and wisdom" visibility={vis("loops")} onVisibilityChange={(v) => setVis("loops", v)}>
                <ListField
                  label="🔄 Behavioral loops"
                  items={data.experiential.loops}
                  onChange={(v) => set(["experiential", "loops"], v)}
                  placeholder="A recurring pattern you've noticed..."
                />
                <ListField
                  label="💡 Hard-won lessons"
                  items={data.experiential.lessons}
                  onChange={(v) => set(["experiential", "lessons"], v)}
                  placeholder="Something you've learned the hard way..."
                />
              </EditorSection>

              {/* Languages */}
              <EditorSection icon="💬" label="Languages" description="Expression & reception" visibility={vis("languages")} onVisibilityChange={(v) => setVis("languages", v)}>
                <TagField
                  label="Receive love through"
                  tags={data.experiential.languages.receiveLoveThrough}
                  onChange={(v) => set(["experiential", "languages", "receiveLoveThrough"], v)}
                  placeholder="e.g. quality_time"
                />
                <TagField
                  label="Express love through"
                  tags={data.experiential.languages.expressLoveThrough}
                  onChange={(v) => set(["experiential", "languages", "expressLoveThrough"], v)}
                  placeholder="e.g. acts_of_service"
                />
                <TextField
                  label="Communication style"
                  value={data.experiential.languages.communicationStyle}
                  onChange={(v) => set(["experiential", "languages", "communicationStyle"], v)}
                  placeholder="How you naturally communicate..."
                />
                <TagField
                  label="Creative expression"
                  tags={data.experiential.languages.creativeExpression}
                  onChange={(v) => set(["experiential", "languages", "creativeExpression"], v)}
                />
                <TextField
                  label="Vulnerability language"
                  value={data.experiential.languages.vulnerabilityLanguage}
                  onChange={(v) => set(["experiential", "languages", "vulnerabilityLanguage"], v)}
                  placeholder="How you show vulnerability..."
                />
              </EditorSection>

              {/* Desires */}
              <EditorSection icon="🔥" label="Desires" description="Pleasure & power" visibility={vis("kinks")} onVisibilityChange={(v) => setVis("kinks", v)}>
                <TextField
                  label="Intellectual"
                  value={data.experiential.kinks.intellectual}
                  onChange={(v) => set(["experiential", "kinks", "intellectual"], v)}
                  placeholder="What stimulates your mind..."
                />
                <TextField
                  label="Relational"
                  value={data.experiential.kinks.relational}
                  onChange={(v) => set(["experiential", "kinks", "relational"], v)}
                  placeholder="What you need in connection..."
                />
                <TextField
                  label="Intensity"
                  value={data.experiential.kinks.intensity}
                  onChange={(v) => set(["experiential", "kinks", "intensity"], v)}
                />
                <TextField
                  label="Play"
                  value={data.experiential.kinks.play}
                  onChange={(v) => set(["experiential", "kinks", "play"], v)}
                />
                <TextField
                  label="Avoids"
                  value={data.experiential.kinks.avoid}
                  onChange={(v) => set(["experiential", "kinks", "avoid"], v)}
                />
              </EditorSection>

              {/* Type */}
              <EditorSection icon="🪞" label="Relational Type" description="Archetype & patterns" visibility={vis("type")} onVisibilityChange={(v) => setVis("type", v)}>
                <TextField label="Archetype" value={data.experiential.type.archetype} onChange={(v) => set(["experiential", "type", "archetype"], v)} placeholder="Your relational archetype..." />
                <TextField label="Attraction pattern" value={data.experiential.type.attractionPattern} onChange={(v) => set(["experiential", "type", "attractionPattern"], v)} />
                <TextField label="Role in relationship" value={data.experiential.type.roleInRelationship} onChange={(v) => set(["experiential", "type", "roleInRelationship"], v)} />
                <TextField label="Recurring pattern" value={data.experiential.type.recurringPattern} onChange={(v) => set(["experiential", "type", "recurringPattern"], v)} multiline />
              </EditorSection>

              {/* Viability */}
              <EditorSection icon="⚡" label="Viability" description="Whether it can work" visibility={vis("viability")} onVisibilityChange={(v) => setVis("viability", v)}>
                <SelectField label="Current season" value={data.viability.currentSeason} onChange={(v) => set(["viability", "currentSeason"], v)} options={[
                  { value: "available_and_seeking", label: "Available & Seeking" },
                  { value: "exploring", label: "Exploring" },
                  { value: "healing", label: "Healing" },
                  { value: "closed", label: "Closed" },
                ]} />
                <SelectField label="Engagement frequency" value={data.viability.engagementFrequency} onChange={(v) => set(["viability", "engagementFrequency"], v)} options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ]} />
                <TextField label="Weekly hours" value={data.viability.weeklyHours} onChange={(v) => set(["viability", "weeklyHours"], v)} placeholder="e.g. 5-10" />
                <SelectField label="Conflict style" value={data.viability.conflictStyle} onChange={(v) => set(["viability", "conflictStyle"], v)} options={[
                  { value: "dialogue", label: "Dialogue" },
                  { value: "use_for_understanding", label: "Use for understanding" },
                  { value: "avoidance", label: "Avoidance" },
                  { value: "confrontation", label: "Confrontation" },
                ]} />
                <SelectField label="Reciprocity model" value={data.viability.reciprocityModel} onChange={(v) => set(["viability", "reciprocityModel"], v)} options={[
                  { value: "symmetric_preferred", label: "Symmetric preferred" },
                  { value: "asymmetric_ok", label: "Asymmetric OK" },
                  { value: "flexible", label: "Flexible" },
                ]} />
                <TagField label="Relationship types" tags={data.viability.relationshipTypes} onChange={(v) => set(["viability", "relationshipTypes"], v)} placeholder="e.g. romantic" />
                <TagField label="Core values" tags={data.viability.coreValues} onChange={(v) => set(["viability", "coreValues"], v)} placeholder="e.g. autonomy" />
                <TagField label="Growth vectors" tags={data.viability.growthVectors} onChange={(v) => set(["viability", "growthVectors"], v)} />
              </EditorSection>

              {/* Seeking */}
              <EditorSection icon="🧭" label="Seeking" description="What you're looking for" visibility={vis("seeking")} onVisibilityChange={(v) => setVis("seeking", v)}>
                <TextField label="Seeking archetype" value={data.seeking.seekingArchetype} onChange={(v) => set(["seeking", "seekingArchetype"], v)} placeholder="Who you're drawn to..." />
                <TextField label="Seeking loops" value={data.seeking.seekingLoops} onChange={(v) => set(["seeking", "seekingLoops"], v)} multiline />
                <TextField label="Seeking lessons" value={data.seeking.seekingLessons} onChange={(v) => set(["seeking", "seekingLessons"], v)} multiline />
                <TagField label="Seeking kinks" tags={data.seeking.seekingKinks} onChange={(v) => set(["seeking", "seekingKinks"], v)} />
                <TagField label="Non-negotiables" tags={data.seeking.nonNegotiables} onChange={(v) => set(["seeking", "nonNegotiables"], v)} placeholder="What you require..." />
                <TagField label="Nice to haves" tags={data.seeking.niceToHaves} onChange={(v) => set(["seeking", "niceToHaves"], v)} />
              </EditorSection>

              {/* Safety */}
              <EditorSection icon="🛡️" label="Safety" description="Consent & boundaries" visibility={vis("safety")} onVisibilityChange={(v) => setVis("safety", v)}>
                <TagField label="Consent frameworks" tags={data.safety.consentFrameworks} onChange={(v) => set(["safety", "consentFrameworks"], v)} placeholder="e.g. enthusiastic_consent_required" />
                <TagField label="Hard boundaries" tags={data.safety.hardBoundaries} onChange={(v) => set(["safety", "hardBoundaries"], v)} />
                <TagField label="Accountability" tags={data.safety.accountability} onChange={(v) => set(["safety", "accountability"], v)} />
                <TextField label="Safe sex practices" value={data.safety.safeSexPractices} onChange={(v) => set(["safety", "safeSexPractices"], v)} />
                <TextField label="Substance clarity" value={data.safety.substanceClarity} onChange={(v) => set(["safety", "substanceClarity"], v)} />
              </EditorSection>

              {/* Economic */}
              <EditorSection icon="💎" label="Economic" description="Labor & exchange" visibility={vis("economic")} onVisibilityChange={(v) => setVis("economic", v)}>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Open to invoicing</label>
                  <button
                    type="button"
                    onClick={() => set(["economic", "openToInvoicing"], !data.economic.openToInvoicing)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      data.economic.openToInvoicing ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {data.economic.openToInvoicing ? "Yes" : "No"}
                  </button>
                </div>
                <TagField label="Contexts" tags={data.economic.contexts} onChange={(v) => set(["economic", "contexts"], v)} placeholder="e.g. mentorship_and_guidance" />
                <TagField label="Values" tags={data.economic.values} onChange={(v) => set(["economic", "values"], v)} placeholder="e.g. explicit_beats_implicit" />
                <TagField label="Boundaries" tags={data.economic.boundaries} onChange={(v) => set(["economic", "boundaries"], v)} placeholder="e.g. only_in_appropriate_contexts" />
                <TagField label="Kink alignment" tags={data.economic.kinkAlignment} onChange={(v) => set(["economic", "kinkAlignment"], v)} placeholder="e.g. power_exchange" />
              </EditorSection>

              {/* Connection */}
              <EditorSection icon="📡" label="Connection" description="Logistics & preferences" visibility={vis("connection")} onVisibilityChange={(v) => setVis("connection", v)}>
                <TextField label="Preferred contact method" value={data.connection.preferredContactMethod} onChange={(v) => set(["connection", "preferredContactMethod"], v)} />
                <TextField label="Response time expectations" value={data.connection.responseTimeExpectations} onChange={(v) => set(["connection", "responseTimeExpectations"], v)} placeholder="e.g. 24-48 hours" />
                <TextField label="Frequency of contact" value={data.connection.frequencyOfContact} onChange={(v) => set(["connection", "frequencyOfContact"], v)} />
                <SelectField label="Meeting modality" value={data.connection.meetingModality} onChange={(v) => set(["connection", "meetingModality"], v)} options={[
                  { value: "online", label: "Online" },
                  { value: "in_person", label: "In person" },
                  { value: "hybrid", label: "Hybrid" },
                ]} />
                <TextField label="Location" value={data.connection.location} onChange={(v) => set(["connection", "location"], v)} />
                <TextField label="Willing to travel" value={data.connection.willingToTravel} onChange={(v) => set(["connection", "willingToTravel"], v)} />
              </EditorSection>

              {/* Glossary */}
              <EditorSection icon="📖" label="Glossary" description="Your personal lexicon" visibility={vis("glossary")} onVisibilityChange={(v) => setVis("glossary", v)}>
                <GlossaryField glossary={data.glossary} onChange={(v) => set(["glossary"], v)} />
              </EditorSection>

              {/* Discovery */}
              <EditorSection icon="🔭" label="Discovery" description="How you want to be found">
                <SelectField label="Profile visibility" value={data.discovery.visibility} onChange={(v) => set(["discovery", "visibility"], v)} options={[
                  { value: "public", label: "Public" },
                  { value: "authenticated", label: "Authenticated users" },
                  { value: "invite_only", label: "Invite only" },
                ]} />
                <SelectField label="Privacy comfort level" value={data.discovery.privacyComfortLevel} onChange={(v) => set(["discovery", "privacyComfortLevel"], v)} options={[
                  { value: "low", label: "Low — share freely" },
                  { value: "medium", label: "Medium — selective" },
                  { value: "high", label: "High — very private" },
                ]} />
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Willing to be compared</label>
                  <button
                    type="button"
                    onClick={() => set(["discovery", "willingToBeCompared"], !data.discovery.willingToBeCompared)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      data.discovery.willingToBeCompared ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {data.discovery.willingToBeCompared ? "Yes" : "No"}
                  </button>
                </div>
                <TextField label="Written bio" value={data.discovery.writtenBio} onChange={(v) => set(["discovery", "writtenBio"], v)} placeholder="How you want to introduce yourself..." multiline />
                <TagField label="Portfolio links" tags={data.discovery.portfolioLinks} onChange={(v) => set(["discovery", "portfolioLinks"], v)} placeholder="e.g. github.com/you" />
              </EditorSection>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Resonance Profile
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResonanceEditor;
