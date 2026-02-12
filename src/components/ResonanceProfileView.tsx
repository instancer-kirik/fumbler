import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Lock } from "lucide-react";
import { useState } from "react";
import type { ResonanceProfile } from "@/data/resonance-profile";

type Visibility = "public" | "matches" | "express";

interface SectionVisibility {
  [sectionId: string]: Visibility;
}

interface ResonanceData {
  sectionVisibility?: SectionVisibility;
  consumer?: { trustSignals?: string[]; distrustSignals?: string[] };
  glossary?: Record<string, { meaning: string; state: string }>;
  economic?: { openToInvoicing?: boolean; contexts?: string[]; values?: string[]; boundaries?: string[]; kinkAlignment?: string[] };
  discovery?: { visibility?: string; seekingStatus?: string; privacyComfortLevel?: string; willingToBeCompared?: boolean; portfolioLinks?: string[]; writtenBio?: string };
  [key: string]: any;
}

interface Props {
  profile: ResonanceProfile;
  onClose: () => void;
  viewerRelationship?: "public" | "match" | "express";
  resonanceData?: ResonanceData | null;
}

const isSectionVisible = (
  sectionId: string,
  sectionVisibility: SectionVisibility | undefined,
  viewerRelationship: "public" | "match" | "express"
): boolean => {
  const vis = sectionVisibility?.[sectionId] || "matches";
  if (vis === "public") return true;
  if (vis === "matches" && (viewerRelationship === "match" || viewerRelationship === "express")) return true;
  if (vis === "express" && viewerRelationship === "express") return true;
  return false;
};

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
    <motion.div layout className="rounded-2xl bg-card border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LockedSection = ({ icon, label }: { icon: string; label: string }) => (
  <div className="rounded-2xl bg-card/50 border border-border p-4 flex items-center gap-3 opacity-60">
    <span className="text-xl">{icon}</span>
    <div className="flex-1">
      <p className="font-display font-semibold text-foreground text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">Visible to closer connections</p>
    </div>
    <Lock className="h-4 w-4 text-muted-foreground" />
  </div>
);

const TagList = ({ items, variant = "default" }: { items: string[]; variant?: "default" | "warm" | "muted" }) => {
  if (!items?.length) return null;
  const styles = { default: "bg-primary/10 text-foreground", warm: "gradient-warm text-primary-foreground", muted: "bg-secondary text-secondary-foreground" };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>{item.replace(/_/g, " ")}</span>
      ))}
    </div>
  );
};

const QuoteList = ({ items }: { items: string[] }) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          <p className="text-sm text-foreground/80 italic">{item}</p>
        </div>
      ))}
    </div>
  );
};

const LabelValue = ({ label, value }: { label: string; value: string }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-2 py-1.5">
      <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{value.replace(/_/g, " ")}</span>
    </div>
  );
};

const ResonanceProfileView = ({ profile, onClose, viewerRelationship = "public", resonanceData }: Props) => {
  const { experiential: exp, core, viability, seeking, safety, economic, connection } = profile;
  const sv = resonanceData?.sectionVisibility;
  const canSee = (id: string) => isSectionVisible(id, sv, viewerRelationship);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background"
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pt-3 pb-2 px-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
          <div className="flex items-center gap-4">
            <img src={profile.image} alt={profile.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-foreground">{profile.name}, {profile.age}</h3>
              <p className="text-sm text-muted-foreground">{profile.handle} · {profile.distance}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.description}</p>
            </div>
            <button onClick={onClose} className="rounded-full bg-secondary p-2 flex-shrink-0">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-3 mt-2">
          {/* Bio & Prompt — always visible */}
          <div className="rounded-2xl gradient-warm p-4">
            <p className="text-sm font-medium text-primary-foreground mb-2">{profile.prompt}</p>
            <p className="text-sm text-primary-foreground/90 italic">"{profile.promptAnswer}"</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm text-foreground/80">{profile.bio}</p>
            {profile.interests?.length > 0 && (
              <div className="mt-3"><TagList items={profile.interests} variant="warm" /></div>
            )}
          </div>

          {/* Core */}
          {canSee("core") ? (
            <SectionCard icon="🎯" label="Core Resonance" description="How they engage" defaultOpen>
              <p className="text-xs text-muted-foreground mb-3">{core.attentionModel}</p>
              <div className="space-y-3">
                <div><p className="text-xs font-semibold text-foreground mb-1.5">✨ Activates</p><TagList items={core.activationVectors?.attracts} variant="warm" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">🚫 Repels</p><TagList items={core.activationVectors?.repels} variant="muted" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">💘 Flirt Interface</p><TagList items={core.flirtInterface?.attracts} /></div>
              </div>
            </SectionCard>
          ) : <LockedSection icon="🎯" label="Core Resonance" />}

          {/* Consumer */}
          {canSee("consumer") ? (
            resonanceData?.consumer && (resonanceData.consumer.trustSignals?.length || resonanceData.consumer.distrustSignals?.length) ? (
              <SectionCard icon="🔎" label="Consumer Interface" description="What works on them">
                <div className="space-y-3">
                  {resonanceData.consumer.trustSignals?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">🟢 Trust signals</p><TagList items={resonanceData.consumer.trustSignals} variant="warm" /></div> : null}
                  {resonanceData.consumer.distrustSignals?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">🔴 Distrust signals</p><TagList items={resonanceData.consumer.distrustSignals} variant="muted" /></div> : null}
                </div>
              </SectionCard>
            ) : null
          ) : <LockedSection icon="🔎" label="Consumer Interface" />}

          {/* Loops */}
          {canSee("loops") ? (
            exp.loops?.length ? <SectionCard icon="🔄" label="Loops" description="Behavioral recursion"><QuoteList items={exp.loops} /></SectionCard> : null
          ) : <LockedSection icon="🔄" label="Loops" />}

          {/* Lessons */}
          {canSee("loops") ? (
            exp.lessons?.length ? <SectionCard icon="💡" label="Lessons" description="Hard-won wisdom"><QuoteList items={exp.lessons} /></SectionCard> : null
          ) : <LockedSection icon="💡" label="Lessons" />}

          {/* Languages */}
          {canSee("languages") ? (
            <SectionCard icon="💬" label="Languages" description="Expression & reception">
              <div className="space-y-3">
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Receives love through</p><TagList items={exp.languages?.receiveLoveThrough} variant="warm" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Expresses love through</p><TagList items={exp.languages?.expressLoveThrough} /></div>
                <LabelValue label="Communication" value={exp.languages?.communicationStyle} />
                <LabelValue label="Vulnerability" value={exp.languages?.vulnerabilityLanguage} />
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Creative expression</p><TagList items={exp.languages?.creativeExpression} variant="muted" /></div>
              </div>
            </SectionCard>
          ) : <LockedSection icon="💬" label="Languages" />}

          {/* Desires */}
          {canSee("kinks") ? (
            <SectionCard icon="🔥" label="Desires" description="Pleasure, power & what they need">
              <div className="space-y-1">
                <LabelValue label="Intellectual" value={exp.kinks?.intellectual} />
                <LabelValue label="Relational" value={exp.kinks?.relational} />
                <LabelValue label="Intensity" value={exp.kinks?.intensity} />
                <LabelValue label="Play" value={exp.kinks?.play} />
                <LabelValue label="Avoids" value={exp.kinks?.avoid} />
              </div>
            </SectionCard>
          ) : <LockedSection icon="🔥" label="Desires" />}

          {/* Type */}
          {canSee("type") ? (
            <SectionCard icon="🪞" label="Relational Type" description="Archetype & pattern geometry">
              <div className="space-y-1">
                <LabelValue label="Archetype" value={exp.type?.archetype} />
                <LabelValue label="Attracts" value={exp.type?.attractionPattern} />
                <LabelValue label="Role" value={exp.type?.roleInRelationship} />
                <LabelValue label="Pattern" value={exp.type?.recurringPattern} />
              </div>
            </SectionCard>
          ) : <LockedSection icon="🪞" label="Relational Type" />}

          {/* Viability */}
          {canSee("viability") ? (
            <SectionCard icon="⚡" label="Viability" description="Whether connection can work">
              <div className="space-y-3">
                <div className="space-y-1">
                  <LabelValue label="Season" value={viability.availability?.currentSeason?.replace(/_/g, " ")} />
                  <LabelValue label="Frequency" value={viability.availability?.engagementFrequency} />
                  <LabelValue label="Hours/week" value={viability.availability?.weeklyHours} />
                  <LabelValue label="Conflict style" value={viability.conflictStyle?.replace(/_/g, " ")} />
                  <LabelValue label="Reciprocity" value={viability.reciprocityModel?.replace(/_/g, " ")} />
                </div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Core values</p><TagList items={viability.coreValues} variant="warm" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Growth vectors</p><TagList items={viability.growthVectors} variant="muted" /></div>
              </div>
            </SectionCard>
          ) : <LockedSection icon="⚡" label="Viability" />}

          {/* Seeking */}
          {canSee("seeking") ? (
            <SectionCard icon="🧭" label="Seeking" description="What they're looking for">
              <div className="space-y-3">
                <LabelValue label="Archetype" value={seeking.seekingArchetype} />
                <LabelValue label="Loops" value={seeking.seekingLoops} />
                <LabelValue label="Lessons" value={seeking.seekingLessons} />
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Non-negotiables</p><TagList items={seeking.nonNegotiables} variant="warm" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Nice to haves</p><TagList items={seeking.niceToHaves} variant="muted" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Seeking kinks</p><TagList items={seeking.seekingKinks} /></div>
              </div>
            </SectionCard>
          ) : <LockedSection icon="🧭" label="Seeking" />}

          {/* Safety */}
          {canSee("safety") ? (
            <SectionCard icon="🛡️" label="Safety" description="Consent, boundaries & accountability">
              <div className="space-y-3">
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Consent frameworks</p><TagList items={safety.consentFrameworks} variant="warm" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Hard boundaries</p><TagList items={safety.hardBoundaries} variant="muted" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Accountability</p><TagList items={safety.accountability} /></div>
                <LabelValue label="Safe sex" value={safety.safeSexPractices} />
                <LabelValue label="Substances" value={safety.substanceClarity} />
              </div>
            </SectionCard>
          ) : <LockedSection icon="🛡️" label="Safety" />}

          {/* Economic */}
          {canSee("economic") ? (
            <SectionCard icon="💎" label="Economic" description="Labor, exchange & value">
              <div className="space-y-3">
                <LabelValue label="Open to invoicing" value={economic.openToInvoicing ? "Yes" : "No"} />
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Values</p><TagList items={economic.values} /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Boundaries</p><TagList items={economic.boundaries} variant="muted" /></div>
              </div>
            </SectionCard>
          ) : <LockedSection icon="💎" label="Economic" />}

          {/* Connection */}
          {canSee("connection") ? (
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
          ) : <LockedSection icon="📡" label="Connection" />}

          {/* Glossary */}
          {canSee("glossary") && resonanceData?.glossary && Object.keys(resonanceData.glossary).length > 0 ? (
            <SectionCard icon="📖" label="Glossary" description="Personal lexicon">
              <div className="space-y-2">
                {Object.entries(resonanceData.glossary).map(([key, entry]) => (
                  <div key={key} className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-sm font-medium text-foreground">{key.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.meaning}</p>
                    {entry.state && <span className="inline-block mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{entry.state.replace(/_/g, " ")}</span>}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : canSee("glossary") ? null : <LockedSection icon="📖" label="Glossary" />}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResonanceProfileView;
