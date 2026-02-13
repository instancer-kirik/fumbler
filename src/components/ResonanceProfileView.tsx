import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Lock, Loader2, Send, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  discovery?: { visibility?: string; seekingStatus?: string; privacyComfortLevel?: string; willingToBeCompared?: boolean; willingToHaveCompatibilityShared?: boolean; portfolioLinks?: string[]; writtenBio?: string; audioIntro?: string; videoIntro?: string };
  core?: any;
  viability?: any;
  experiential?: any;
  seeking?: any;
  safety?: any;
  connection?: any;
  archetypes?: any[];
  attraction?: { slowBurn?: boolean; fastHook?: boolean; whatDrawsIn?: string[]; timeline?: string };
  engagement?: { phase1?: string; phase2?: string; phase3?: string; cooperationStyle?: string };
  powerDynamics?: { enabled?: boolean; expressionModes?: string[]; exploration?: string };
  playPreferences?: { mode?: string; intensityProfile?: { emotional?: number; theatrical?: number; intellectual?: number } };
  repulsion?: { hardStops?: string[]; yellowFlags?: string[]; patternConcerns?: string[] };
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

const LockedSection = ({
  icon,
  label,
  sectionId,
  targetId,
  requestStatus,
  onRequestAccess,
}: {
  icon: string;
  label: string;
  sectionId: string;
  targetId: string;
  requestStatus?: string | null;
  onRequestAccess: (sectionId: string) => void;
}) => (
  <div className="rounded-2xl bg-card/50 border border-border p-4 flex items-center gap-3 opacity-60">
    <span className="text-xl">{icon}</span>
    <div className="flex-1">
      <p className="font-display font-semibold text-foreground text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">
        {requestStatus === "pending"
          ? "Access requested — waiting for response"
          : requestStatus === "denied"
          ? "Access request was declined"
          : "Request access to view"}
      </p>
    </div>
    {requestStatus === "pending" ? (
      <Check className="h-4 w-4 text-muted-foreground" />
    ) : requestStatus === "denied" ? (
      <Lock className="h-4 w-4 text-muted-foreground" />
    ) : (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRequestAccess(sectionId);
        }}
        className="rounded-full bg-primary/10 p-1.5 hover:bg-primary/20 transition-colors"
        title="Request access"
      >
        <Send className="h-3.5 w-3.5 text-primary" />
      </button>
    )}
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

const IntensityBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-primary font-medium">{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const ResonanceProfileView = ({ profile, onClose, viewerRelationship: propRelationship, resonanceData: propData }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(!propData);
  const [dbData, setDbData] = useState<ResonanceData | null>(propData || null);
  const [relationship, setRelationship] = useState<"public" | "match" | "express">(propRelationship || "public");
  const [accessRequests, setAccessRequests] = useState<Record<string, string>>({});

  useEffect(() => {
    if (propData !== undefined) return;
    if (!user || !profile.id) return;

    const fetchAll = async () => {
      setLoading(true);
      const [profileRes, matchRes, accessRes] = await Promise.all([
        supabase.from("profiles").select("resonance_data").eq("id", profile.id).single(),
        supabase.from("matches").select("id").or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`).limit(1),
        supabase.from("resonance_access_requests").select("section_id, status").eq("requester_id", user.id).eq("target_id", profile.id),
      ]);

      if (profileRes.data?.resonance_data) {
        setDbData(profileRes.data.resonance_data as any);
      }

      const isMatch = (matchRes.data?.length ?? 0) > 0;
      const approvedSections = (accessRes.data || []).filter((r: any) => r.status === "approved").map((r: any) => r.section_id);
      const hasExpress = approvedSections.length > 0;
      setRelationship(hasExpress ? "express" : isMatch ? "match" : "public");

      const reqMap: Record<string, string> = {};
      (accessRes.data || []).forEach((r: any) => {
        reqMap[r.section_id] = r.status;
      });
      setAccessRequests(reqMap);
      setLoading(false);
    };

    fetchAll();
  }, [user, profile.id, propData]);

  const handleRequestAccess = async (sectionId: string) => {
    if (!user) return;
    const { error } = await supabase.from("resonance_access_requests").insert({
      requester_id: user.id,
      target_id: profile.id,
      section_id: sectionId,
    });
    if (error) {
      toast.error("Failed to send request");
    } else {
      setAccessRequests((prev) => ({ ...prev, [sectionId]: "pending" }));
      toast.success("Access request sent!");
    }
  };

  const rd = dbData;
  const sv = rd?.sectionVisibility;
  const core = rd?.core || profile.core;
  const viability = rd?.viability || profile.viability;
  const exp = rd?.experiential || profile.experiential;
  const seeking = rd?.seeking || profile.seeking;
  const safety = rd?.safety || profile.safety;
  const economic = rd?.economic || profile.economic;
  const connection = rd?.connection || profile.connection;

  const canSee = (id: string) => isSectionVisible(id, sv, relationship);

  const renderLocked = (icon: string, label: string, sectionId: string) => (
    <LockedSection
      icon={icon}
      label={label}
      sectionId={sectionId}
      targetId={profile.id}
      requestStatus={accessRequests[sectionId] || null}
      onRequestAccess={handleRequestAccess}
    />
  );

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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
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
                <p className="text-xs text-muted-foreground mb-3">{core?.attentionModel}</p>
                <div className="space-y-3">
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">✨ Activates</p><TagList items={core?.activationVectors?.attracts} variant="warm" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">🚫 Repels</p><TagList items={core?.activationVectors?.repels} variant="muted" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">💘 Flirt Interface</p><TagList items={core?.flirtInterface?.attracts} /></div>
                </div>
              </SectionCard>
            ) : renderLocked("🎯", "Core Resonance", "core")}

            {/* Consumer */}
            {canSee("consumer") ? (
              rd?.consumer && (rd.consumer.trustSignals?.length || rd.consumer.distrustSignals?.length) ? (
                <SectionCard icon="🔎" label="Consumer Interface" description="What works on them">
                  <div className="space-y-3">
                    {rd.consumer.trustSignals?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">🟢 Trust signals</p><TagList items={rd.consumer.trustSignals} variant="warm" /></div> : null}
                    {rd.consumer.distrustSignals?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">🔴 Distrust signals</p><TagList items={rd.consumer.distrustSignals} variant="muted" /></div> : null}
                  </div>
                </SectionCard>
              ) : null
            ) : renderLocked("🔎", "Consumer Interface", "consumer")}

            {/* Loops */}
            {canSee("loops") ? (
              exp?.loops?.length ? <SectionCard icon="🔄" label="Loops" description="Behavioral recursion"><QuoteList items={exp.loops} /></SectionCard> : null
            ) : renderLocked("🔄", "Loops", "loops")}

            {/* Lessons */}
            {canSee("lessons") ? (
              exp?.lessons?.length ? <SectionCard icon="💡" label="Lessons" description="Hard-won wisdom"><QuoteList items={exp.lessons} /></SectionCard> : null
            ) : renderLocked("💡", "Lessons", "lessons")}

            {/* Languages */}
            {canSee("languages") ? (
              <SectionCard icon="💬" label="Languages" description="Expression & reception">
                <div className="space-y-3">
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Receives love through</p><TagList items={exp?.languages?.receiveLoveThrough} variant="warm" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Expresses love through</p><TagList items={exp?.languages?.expressLoveThrough} /></div>
                  <LabelValue label="Communication" value={exp?.languages?.communicationStyle} />
                  <LabelValue label="Vulnerability" value={exp?.languages?.vulnerabilityLanguage} />
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Creative expression</p><TagList items={exp?.languages?.creativeExpression} variant="muted" /></div>
                </div>
              </SectionCard>
            ) : renderLocked("💬", "Languages", "languages")}

            {/* Desires */}
            {canSee("kinks") ? (
              <SectionCard icon="🔥" label="Desires" description="Pleasure, power & what they need">
                <div className="space-y-1">
                  <LabelValue label="Intellectual" value={exp?.kinks?.intellectual} />
                  <LabelValue label="Relational" value={exp?.kinks?.relational} />
                  <LabelValue label="Intensity" value={exp?.kinks?.intensity} />
                  <LabelValue label="Play" value={exp?.kinks?.play} />
                  <LabelValue label="Avoids" value={exp?.kinks?.avoid} />
                </div>
              </SectionCard>
            ) : renderLocked("🔥", "Desires", "kinks")}

            {/* Type */}
            {canSee("type") ? (
              <SectionCard icon="🪞" label="Relational Type" description="Archetype & pattern geometry">
                <div className="space-y-1">
                  <LabelValue label="Archetype" value={exp?.type?.archetype} />
                  <LabelValue label="Attracts" value={exp?.type?.attractionPattern} />
                  <LabelValue label="Role" value={exp?.type?.roleInRelationship} />
                  <LabelValue label="Pattern" value={exp?.type?.recurringPattern} />
                </div>
              </SectionCard>
            ) : renderLocked("🪞", "Relational Type", "type")}

            {/* ═══ NEW: Archetypes ═══ */}
            {canSee("archetypes") ? (
              rd?.archetypes?.length ? (
                <SectionCard icon="🎭" label="Archetypes" description="Identity packets">
                  <div className="space-y-2">
                    {rd.archetypes.map((arch: any) => (
                      <div key={arch.id || arch.label} className="rounded-xl bg-secondary/50 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{arch.label}</p>
                            <p className="text-xs text-muted-foreground">{arch.class} · {arch.energy?.replace(/_/g, " ")}</p>
                          </div>
                          {arch.isCustom && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">custom</span>}
                        </div>
                        {arch.aesthetic?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {arch.aesthetic.map((a: string) => (
                              <span key={a} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ) : null
            ) : renderLocked("🎭", "Archetypes", "archetypes")}

            {/* ═══ NEW: Attraction Gradient ═══ */}
            {canSee("attraction") ? (
              rd?.attraction && (rd.attraction.slowBurn || rd.attraction.fastHook || rd.attraction.whatDrawsIn?.length) ? (
                <SectionCard icon="🧲" label="Attraction Gradient" description="What draws them in">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {rd.attraction.slowBurn && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">🕯️ Slow Burn</span>}
                      {rd.attraction.fastHook && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">⚡ Fast Hook</span>}
                    </div>
                    {rd.attraction.whatDrawsIn?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">What draws in</p><TagList items={rd.attraction.whatDrawsIn} variant="warm" /></div> : null}
                    <LabelValue label="Timeline" value={rd.attraction.timeline || ""} />
                  </div>
                </SectionCard>
              ) : null
            ) : renderLocked("🧲", "Attraction Gradient", "attraction")}

            {/* ═══ NEW: Engagement Curve ═══ */}
            {canSee("engagement") ? (
              rd?.engagement && (rd.engagement.phase1 || rd.engagement.phase2 || rd.engagement.phase3) ? (
                <SectionCard icon="📈" label="Engagement Curve" description="How connection develops">
                  <div className="space-y-3">
                    {rd.engagement.phase1 && (
                      <div className="rounded-xl bg-secondary/50 p-3">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-1">Phase 1 — Initial</p>
                        <p className="text-xs text-foreground/80">{rd.engagement.phase1}</p>
                      </div>
                    )}
                    {rd.engagement.phase2 && (
                      <div className="rounded-xl bg-secondary/50 p-3">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-1">Phase 2 — Building</p>
                        <p className="text-xs text-foreground/80">{rd.engagement.phase2}</p>
                      </div>
                    )}
                    {rd.engagement.phase3 && (
                      <div className="rounded-xl bg-secondary/50 p-3">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-1">Phase 3 — Established</p>
                        <p className="text-xs text-foreground/80">{rd.engagement.phase3}</p>
                      </div>
                    )}
                    <LabelValue label="Cooperation" value={rd.engagement.cooperationStyle || ""} />
                  </div>
                </SectionCard>
              ) : null
            ) : renderLocked("📈", "Engagement Curve", "engagement")}

            {/* ═══ NEW: Dynamics (Power + Play) ═══ */}
            {canSee("dynamics") ? (
              (rd?.powerDynamics?.enabled || rd?.playPreferences?.mode) ? (
                <SectionCard icon="⚔️" label="Dynamics" description="Power exchange & play">
                  <div className="space-y-3">
                    {rd?.powerDynamics?.enabled && (
                      <>
                        {rd.powerDynamics.expressionModes?.length ? (
                          <div><p className="text-xs font-semibold text-foreground mb-1.5">Expression modes</p><TagList items={rd.powerDynamics.expressionModes} /></div>
                        ) : null}
                        {rd.powerDynamics.exploration && <LabelValue label="Exploration" value={rd.powerDynamics.exploration} />}
                      </>
                    )}
                    {rd?.playPreferences?.mode && <LabelValue label="Play mode" value={rd.playPreferences.mode} />}
                    {rd?.playPreferences?.intensityProfile && (
                      <div className="space-y-2">
                        <IntensityBar label="Emotional" value={rd.playPreferences.intensityProfile.emotional ?? 50} />
                        <IntensityBar label="Theatrical" value={rd.playPreferences.intensityProfile.theatrical ?? 50} />
                        <IntensityBar label="Intellectual" value={rd.playPreferences.intensityProfile.intellectual ?? 50} />
                      </div>
                    )}
                  </div>
                </SectionCard>
              ) : null
            ) : renderLocked("⚔️", "Dynamics", "dynamics")}

            {/* ═══ NEW: Repulsion Vectors ═══ */}
            {canSee("repulsion") ? (
              rd?.repulsion && (rd.repulsion.hardStops?.length || rd.repulsion.yellowFlags?.length || rd.repulsion.patternConcerns?.length) ? (
                <SectionCard icon="🚧" label="Repulsion Vectors" description="Hard stops & flags">
                  <div className="space-y-3">
                    {rd.repulsion.hardStops?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">🛑 Hard stops</p><TagList items={rd.repulsion.hardStops} variant="muted" /></div> : null}
                    {rd.repulsion.yellowFlags?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">⚠️ Yellow flags</p><TagList items={rd.repulsion.yellowFlags} /></div> : null}
                    {rd.repulsion.patternConcerns?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">🔍 Pattern concerns</p><TagList items={rd.repulsion.patternConcerns} /></div> : null}
                  </div>
                </SectionCard>
              ) : null
            ) : renderLocked("🚧", "Repulsion Vectors", "repulsion")}

            {/* Viability */}
            {canSee("viability") ? (
              <SectionCard icon="⚡" label="Viability" description="Whether connection can work">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <LabelValue label="Season" value={viability?.availability?.currentSeason?.replace?.(/_/g, " ") || viability?.currentSeason?.replace?.(/_/g, " ")} />
                    <LabelValue label="Frequency" value={viability?.availability?.engagementFrequency || viability?.engagementFrequency} />
                    <LabelValue label="Hours/week" value={viability?.availability?.weeklyHours || viability?.weeklyHours} />
                    <LabelValue label="Conflict style" value={viability?.conflictStyle?.replace?.(/_/g, " ")} />
                    <LabelValue label="Reciprocity" value={viability?.reciprocityModel?.replace?.(/_/g, " ")} />
                  </div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Core values</p><TagList items={viability?.coreValues} variant="warm" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Growth vectors</p><TagList items={viability?.growthVectors} variant="muted" /></div>
                </div>
              </SectionCard>
            ) : renderLocked("⚡", "Viability", "viability")}

            {/* Seeking */}
            {canSee("seeking") ? (
              <SectionCard icon="🧭" label="Seeking" description="What they're looking for">
                <div className="space-y-3">
                  <LabelValue label="Archetype" value={seeking?.seekingArchetype} />
                  <LabelValue label="Loops" value={seeking?.seekingLoops} />
                  <LabelValue label="Lessons" value={seeking?.seekingLessons} />
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Non-negotiables</p><TagList items={seeking?.nonNegotiables} variant="warm" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Nice to haves</p><TagList items={seeking?.niceToHaves} variant="muted" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Seeking kinks</p><TagList items={seeking?.seekingKinks} /></div>
                </div>
              </SectionCard>
            ) : renderLocked("🧭", "Seeking", "seeking")}

            {/* Safety + Trust */}
            {canSee("safety") ? (
              <SectionCard icon="🛡️" label="Safety & Trust" description="Consent, boundaries & accountability">
                <div className="space-y-3">
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Consent frameworks</p><TagList items={safety?.consentFrameworks} variant="warm" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Hard boundaries</p><TagList items={safety?.hardBoundaries} variant="muted" /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Accountability</p><TagList items={safety?.accountability} /></div>
                  <LabelValue label="Safe sex" value={safety?.safeSexPractices} />
                  <LabelValue label="Substances" value={safety?.substanceClarity} />
                  {safety?.harmHistory && <LabelValue label="Harm history" value={safety.harmHistory} />}
                  {safety?.referencesAvailable && (
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">✅ References available</span>
                  )}
                </div>
              </SectionCard>
            ) : renderLocked("🛡️", "Safety & Trust", "safety")}

            {/* Economic */}
            {canSee("economic") ? (
              <SectionCard icon="💎" label="Economic" description="Labor, exchange & value">
                <div className="space-y-3">
                  <LabelValue label="Open to invoicing" value={economic?.openToInvoicing ? "Yes" : "No"} />
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Values</p><TagList items={economic?.values} /></div>
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Boundaries</p><TagList items={economic?.boundaries} variant="muted" /></div>
                  {economic?.kinkAlignment?.length ? <div><p className="text-xs font-semibold text-foreground mb-1.5">Kink alignment</p><TagList items={economic.kinkAlignment} variant="warm" /></div> : null}
                </div>
              </SectionCard>
            ) : renderLocked("💎", "Economic", "economic")}

            {/* Connection */}
            {canSee("connection") ? (
              <SectionCard icon="📡" label="Connection" description="Logistics & preferences">
                <div className="space-y-1">
                  <LabelValue label="Contact" value={connection?.preferredContactMethod} />
                  <LabelValue label="Response time" value={connection?.responseTimeExpectations} />
                  <LabelValue label="Frequency" value={connection?.frequencyOfContact} />
                  <LabelValue label="Modality" value={connection?.meetingModality} />
                  <LabelValue label="Location" value={connection?.location} />
                  <LabelValue label="Travel" value={connection?.willingToTravel} />
                </div>
              </SectionCard>
            ) : renderLocked("📡", "Connection", "connection")}

            {/* Glossary */}
            {canSee("glossary") && rd?.glossary && Object.keys(rd.glossary).length > 0 ? (
              <SectionCard icon="📖" label="Glossary" description="Personal lexicon">
                <div className="space-y-2">
                  {Object.entries(rd.glossary).map(([key, entry]) => (
                    <div key={key} className="rounded-xl bg-secondary/50 p-3">
                      <p className="text-sm font-medium text-foreground">{key.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.meaning}</p>
                      {entry.state && <span className="inline-block mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{entry.state.replace(/_/g, " ")}</span>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : canSee("glossary") ? null : renderLocked("📖", "Glossary", "glossary")}

            {/* Discovery Media */}
            {canSee("discovery") && rd?.discovery && (rd.discovery.audioIntro || rd.discovery.videoIntro) ? (
              <SectionCard icon="🔭" label="Discovery" description="Introduction media">
                <div className="space-y-3">
                  {rd.discovery.audioIntro && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">🎙️ Audio intro</p>
                      <audio controls className="w-full" src={rd.discovery.audioIntro} />
                    </div>
                  )}
                  {rd.discovery.videoIntro && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">🎬 Video intro</p>
                      <video controls className="w-full rounded-xl" src={rd.discovery.videoIntro} />
                    </div>
                  )}
                </div>
              </SectionCard>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ResonanceProfileView;
