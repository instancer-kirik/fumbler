import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ResonanceProfile } from "@/data/resonance-profile";
import { RESONANCE_SECTIONS } from "@/data/resonance-profile";

interface Props {
  profile: ResonanceProfile;
  onClose: () => void;
}

const SectionCard = ({
  icon,
  label,
  description,
  children,
  defaultOpen = false,
}: {
  icon: string;
  label: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      layout
      className="rounded-2xl bg-card border border-border overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
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
            <div className="px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TagList = ({ items, variant = "default" }: { items: string[]; variant?: "default" | "warm" | "muted" }) => {
  const styles = {
    default: "bg-primary/10 text-foreground",
    warm: "gradient-warm text-primary-foreground",
    muted: "bg-secondary text-secondary-foreground",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>
          {item.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
};

const QuoteList = ({ items }: { items: string[] }) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <div key={i} className="flex gap-2">
        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
        <p className="text-sm text-foreground/80 italic">{item}</p>
      </div>
    ))}
  </div>
);

const LabelValue = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start gap-2 py-1.5">
    <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{label}</span>
    <span className="text-xs text-foreground text-right">{value.replace(/_/g, " ")}</span>
  </div>
);

const ResonanceProfileView = ({ profile, onClose }: Props) => {
  const { experiential: exp, core, viability, seeking, safety, economic, connection } = profile;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
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
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pt-3 pb-2 px-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
          <div className="flex items-center gap-4">
            <img
              src={profile.image}
              alt={profile.name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-foreground">
                {profile.name}, {profile.age}
              </h3>
              <p className="text-sm text-muted-foreground">{profile.handle} · {profile.distance}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.description}</p>
            </div>
            <button onClick={onClose} className="rounded-full bg-secondary p-2 flex-shrink-0">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-3 mt-2">
          {/* Bio & Prompt */}
          <div className="rounded-2xl gradient-warm p-4">
            <p className="text-sm font-medium text-primary-foreground mb-2">{profile.prompt}</p>
            <p className="text-sm text-primary-foreground/90 italic">"{profile.promptAnswer}"</p>
          </div>

          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm text-foreground/80">{profile.bio}</p>
            <div className="mt-3">
              <TagList items={profile.interests} variant="warm" />
            </div>
          </div>

          {/* Core Resonance */}
          <SectionCard icon="🎯" label="Core Resonance" description="How they engage" defaultOpen>
            <p className="text-xs text-muted-foreground mb-3">{core.attentionModel}</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">✨ Activates</p>
                <TagList items={core.activationVectors.attracts} variant="warm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">🚫 Repels</p>
                <TagList items={core.activationVectors.repels} variant="muted" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">💘 Flirt Interface</p>
                <TagList items={core.flirtInterface.attracts} />
              </div>
            </div>
          </SectionCard>

          {/* Loops */}
          <SectionCard icon="🔄" label="Loops" description="Behavioral recursion patterns">
            <QuoteList items={exp.loops} />
          </SectionCard>

          {/* Lessons */}
          <SectionCard icon="💡" label="Lessons" description="Hard-won integrated wisdom">
            <QuoteList items={exp.lessons} />
          </SectionCard>

          {/* Languages */}
          <SectionCard icon="💬" label="Languages" description="Expression & reception modalities">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Receives love through</p>
                <TagList items={exp.languages.receiveLoveThrough} variant="warm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Expresses love through</p>
                <TagList items={exp.languages.expressLoveThrough} />
              </div>
              <LabelValue label="Communication" value={exp.languages.communicationStyle} />
              <LabelValue label="Vulnerability" value={exp.languages.vulnerabilityLanguage} />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Creative expression</p>
                <TagList items={exp.languages.creativeExpression} variant="muted" />
              </div>
            </div>
          </SectionCard>

          {/* Desires / Kinks */}
          <SectionCard icon="🔥" label="Desires" description="Pleasure, power & what they need">
            <div className="space-y-1">
              <LabelValue label="Intellectual" value={exp.kinks.intellectual} />
              <LabelValue label="Relational" value={exp.kinks.relational} />
              <LabelValue label="Intensity" value={exp.kinks.intensity} />
              <LabelValue label="Play" value={exp.kinks.play} />
              <LabelValue label="Avoids" value={exp.kinks.avoid} />
            </div>
          </SectionCard>

          {/* Type */}
          <SectionCard icon="🪞" label="Relational Type" description="Archetype & pattern geometry">
            <div className="space-y-1">
              <LabelValue label="Archetype" value={exp.type.archetype} />
              <LabelValue label="Attracts" value={exp.type.attractionPattern} />
              <LabelValue label="Role" value={exp.type.roleInRelationship} />
              <LabelValue label="Pattern" value={exp.type.recurringPattern} />
            </div>
          </SectionCard>

          {/* Viability */}
          <SectionCard icon="⚡" label="Viability" description="Whether connection can work">
            <div className="space-y-3">
              <div className="space-y-1">
                <LabelValue label="Season" value={viability.availability.currentSeason.replace(/_/g, " ")} />
                <LabelValue label="Frequency" value={viability.availability.engagementFrequency} />
                <LabelValue label="Hours/week" value={viability.availability.weeklyHours} />
                <LabelValue label="Conflict style" value={viability.conflictStyle.replace(/_/g, " ")} />
                <LabelValue label="Reciprocity" value={viability.reciprocityModel.replace(/_/g, " ")} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Core values</p>
                <TagList items={viability.coreValues} variant="warm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Growth vectors</p>
                <TagList items={viability.growthVectors} variant="muted" />
              </div>
            </div>
          </SectionCard>

          {/* Seeking */}
          <SectionCard icon="🧭" label="Seeking" description="What they're looking for">
            <div className="space-y-3">
              <LabelValue label="Archetype" value={seeking.seekingArchetype} />
              <LabelValue label="Loops" value={seeking.seekingLoops} />
              <LabelValue label="Lessons" value={seeking.seekingLessons} />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Non-negotiables</p>
                <TagList items={seeking.nonNegotiables} variant="warm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Nice to haves</p>
                <TagList items={seeking.niceToHaves} variant="muted" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Seeking kinks</p>
                <TagList items={seeking.seekingKinks} />
              </div>
            </div>
          </SectionCard>

          {/* Safety */}
          <SectionCard icon="🛡️" label="Safety" description="Consent, boundaries & accountability">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Consent frameworks</p>
                <TagList items={safety.consentFrameworks} variant="warm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Hard boundaries</p>
                <TagList items={safety.hardBoundaries} variant="muted" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Accountability</p>
                <TagList items={safety.accountability} />
              </div>
              <LabelValue label="Safe sex" value={safety.safeSexPractices} />
              <LabelValue label="Substances" value={safety.substanceClarity} />
            </div>
          </SectionCard>

          {/* Economic */}
          <SectionCard icon="💎" label="Economic" description="Labor, exchange & value">
            <div className="space-y-3">
              <LabelValue label="Open to invoicing" value={economic.openToInvoicing ? "Yes" : "No"} />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Values</p>
                <TagList items={economic.values} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Boundaries</p>
                <TagList items={economic.boundaries} variant="muted" />
              </div>
            </div>
          </SectionCard>

          {/* Connection */}
          <SectionCard icon="📡" label="Connection" description="Logistics & preferences">
            <div className="space-y-1">
              <LabelValue label="Contact" value={connection.preferredContactMethod} />
              <LabelValue label="Response time" value={connection.responseTimeExpectations} />
              <LabelValue label="Frequency" value={connection.frequencyOfContact} />
              <LabelValue label="Modality" value={connection.meetingModality} />
              <LabelValue label="Location" value={connection.location} />
              <LabelValue label="Travel" value={connection.willingToTravel} />
            </div>
          </SectionCard>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResonanceProfileView;
