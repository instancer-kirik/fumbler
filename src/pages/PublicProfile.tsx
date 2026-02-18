import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PublicProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  resonance_data: any;
}

type Visibility = "public" | "matches" | "express";

const isSectionVisible = (sectionId: string, sv: Record<string, Visibility> | undefined): boolean => {
  const vis = sv?.[sectionId] || "matches";
  return vis === "public";
};

const TagList = ({ items, variant = "default" }: { items?: string[]; variant?: "default" | "warm" | "muted" }) => {
  if (!items?.length) return null;
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

const LabelValue = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-2 py-1.5">
      <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{value.replace(/_/g, " ")}</span>
    </div>
  );
};

const QuoteList = ({ items }: { items?: string[] }) => {
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

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, age, resonance_data")
        .eq("username", username)
        .maybeSingle();

      if (!data || error) {
        setNotFound(true);
      } else {
        setProfile(data as any);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Profile not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          @{username} doesn't exist or hasn't set up their profile yet.
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-2xl gradient-warm px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Go to Fumbler
        </button>
      </div>
    );
  }

  const rd = profile.resonance_data as any;
  const sv = rd?.sectionVisibility as Record<string, Visibility> | undefined;
  const canSee = (id: string) => isSectionVisible(id, sv);

  const core = rd?.core;
  const exp = rd?.experiential;
  const viability = rd?.viability;
  const seeking = rd?.seeking;
  const safety = rd?.safety;
  const connection = rd?.connection;

  const hasAnyPublicSection = rd && sv && Object.values(sv).some((v) => v === "public");

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background px-4 pt-6 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="h-24 w-24 overflow-hidden rounded-full gradient-warm p-[3px] mb-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name || ""} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-2xl font-display text-muted-foreground">
              {profile.full_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">
          {profile.full_name || "Anonymous"}{profile.age ? `, ${profile.age}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="mt-2 text-sm text-foreground/80 text-center max-w-xs">{profile.bio}</p>
        )}
      </motion.div>

      {/* Resonance sections */}
      {!rd || !hasAnyPublicSection ? (
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No public resonance sections yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bio from discovery */}
          {canSee("discovery") && rd?.discovery?.writtenBio && (
            <div className="rounded-2xl gradient-warm p-4">
              <p className="text-sm text-primary-foreground/90">{rd.discovery.writtenBio}</p>
            </div>
          )}

          {/* Core Resonance */}
          {canSee("core") && core && (
            <SectionCard icon="🎯" label="Core Resonance" description="How they engage" defaultOpen>
              <p className="text-xs text-muted-foreground mb-3">{core?.attentionModel}</p>
              <div className="space-y-3">
                {core?.activationVectors?.attracts?.length > 0 && (
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">✨ Activates</p><TagList items={core.activationVectors.attracts} variant="warm" /></div>
                )}
                {core?.activationVectors?.repels?.length > 0 && (
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">🚫 Repels</p><TagList items={core.activationVectors.repels} variant="muted" /></div>
                )}
                {core?.flirtInterface?.attracts?.length > 0 && (
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">💘 Flirt Interface</p><TagList items={core.flirtInterface.attracts} /></div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Consumer Interface */}
          {canSee("consumer") && rd?.consumer && (rd.consumer.trustSignals?.length || rd.consumer.distrustSignals?.length) && (
            <SectionCard icon="🔎" label="Consumer Interface" description="What works on them">
              <div className="space-y-3">
                {rd.consumer.trustSignals?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">🟢 Trust signals</p><TagList items={rd.consumer.trustSignals} variant="warm" /></div>}
                {rd.consumer.distrustSignals?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">🔴 Distrust signals</p><TagList items={rd.consumer.distrustSignals} variant="muted" /></div>}
              </div>
            </SectionCard>
          )}

          {/* Loops */}
          {canSee("loops") && exp?.loops?.length > 0 && (
            <SectionCard icon="🔄" label="Loops" description="Behavioral recursion">
              <QuoteList items={exp.loops} />
            </SectionCard>
          )}

          {/* Languages */}
          {canSee("languages") && exp?.languages && (
            <SectionCard icon="💬" label="Languages" description="Expression & reception">
              <div className="space-y-3">
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Receives love through</p><TagList items={exp.languages.receiveLoveThrough} variant="warm" /></div>
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Expresses love through</p><TagList items={exp.languages.expressLoveThrough} /></div>
                <LabelValue label="Communication" value={exp.languages.communicationStyle} />
                <LabelValue label="Vulnerability" value={exp.languages.vulnerabilityLanguage} />
                <div><p className="text-xs font-semibold text-foreground mb-1.5">Creative expression</p><TagList items={exp.languages.creativeExpression} variant="muted" /></div>
              </div>
            </SectionCard>
          )}

          {/* Archetypes */}
          {canSee("archetypes") && rd?.archetypes?.length > 0 && (
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
          )}

          {/* Attraction */}
          {canSee("attraction") && rd?.attraction && (rd.attraction.slowBurn || rd.attraction.fastHook || rd.attraction.whatDrawsIn?.length) && (
            <SectionCard icon="🧲" label="Attraction Gradient" description="What draws them in">
              <div className="space-y-3">
                <div className="flex gap-2">
                  {rd.attraction.slowBurn && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">🕯️ Slow Burn</span>}
                  {rd.attraction.fastHook && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">⚡ Fast Hook</span>}
                </div>
                {rd.attraction.whatDrawsIn?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">What draws in</p><TagList items={rd.attraction.whatDrawsIn} variant="warm" /></div>}
                <LabelValue label="Timeline" value={rd.attraction.timeline} />
              </div>
            </SectionCard>
          )}

          {/* Engagement Curve */}
          {canSee("engagement") && rd?.engagement && (rd.engagement.phase1 || rd.engagement.phase2 || rd.engagement.phase3) && (
            <SectionCard icon="📈" label="Engagement Curve" description="How connection develops">
              <div className="space-y-3">
                {rd.engagement.phase1 && <div className="rounded-xl bg-secondary/50 p-3"><p className="text-[10px] font-semibold text-primary uppercase mb-1">Phase 1 — Initial</p><p className="text-xs text-foreground/80">{rd.engagement.phase1}</p></div>}
                {rd.engagement.phase2 && <div className="rounded-xl bg-secondary/50 p-3"><p className="text-[10px] font-semibold text-primary uppercase mb-1">Phase 2 — Building</p><p className="text-xs text-foreground/80">{rd.engagement.phase2}</p></div>}
                {rd.engagement.phase3 && <div className="rounded-xl bg-secondary/50 p-3"><p className="text-[10px] font-semibold text-primary uppercase mb-1">Phase 3 — Established</p><p className="text-xs text-foreground/80">{rd.engagement.phase3}</p></div>}
                <LabelValue label="Cooperation" value={rd.engagement.cooperationStyle} />
              </div>
            </SectionCard>
          )}

          {/* Dynamics */}
          {canSee("dynamics") && (rd?.powerDynamics?.enabled || rd?.playPreferences?.mode) && (
            <SectionCard icon="⚔️" label="Dynamics" description="Power exchange & play">
              <div className="space-y-3">
                {rd.powerDynamics?.enabled && rd.powerDynamics.expressionModes?.length > 0 && (
                  <div><p className="text-xs font-semibold text-foreground mb-1.5">Expression modes</p><TagList items={rd.powerDynamics.expressionModes} /></div>
                )}
                {rd.powerDynamics?.exploration && <LabelValue label="Exploration" value={rd.powerDynamics.exploration} />}
                {rd.playPreferences?.mode && <LabelValue label="Play mode" value={rd.playPreferences.mode} />}
                {rd.playPreferences?.intensityProfile && (
                  <div className="space-y-2">
                    <IntensityBar label="Emotional" value={rd.playPreferences.intensityProfile.emotional ?? 50} />
                    <IntensityBar label="Theatrical" value={rd.playPreferences.intensityProfile.theatrical ?? 50} />
                    <IntensityBar label="Intellectual" value={rd.playPreferences.intensityProfile.intellectual ?? 50} />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Repulsion Vectors */}
          {canSee("repulsion") && rd?.repulsion && (rd.repulsion.hardStops?.length || rd.repulsion.yellowFlags?.length || rd.repulsion.patternConcerns?.length) && (
            <SectionCard icon="🚧" label="Repulsion Vectors" description="Hard stops & flags">
              <div className="space-y-3">
                {rd.repulsion.hardStops?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">🛑 Hard stops</p><TagList items={rd.repulsion.hardStops} variant="muted" /></div>}
                {rd.repulsion.yellowFlags?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">⚠️ Yellow flags</p><TagList items={rd.repulsion.yellowFlags} /></div>}
                {rd.repulsion.patternConcerns?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">🔍 Pattern concerns</p><TagList items={rd.repulsion.patternConcerns} /></div>}
              </div>
            </SectionCard>
          )}

          {/* Availability */}
          {canSee("viability") && viability && (
            <SectionCard icon="🌱" label="Availability & Rhythm" description="Season, capacity & how they show up">
              <div className="space-y-3">
                <LabelValue label="Season" value={viability?.availability?.currentSeason?.replace?.(/_/g, " ") || viability?.currentSeason?.replace?.(/_/g, " ")} />
                <LabelValue label="Rhythm" value={viability?.availability?.engagementFrequency || viability?.engagementFrequency} />
                <LabelValue label="Energy budget" value={viability?.availability?.weeklyHours || viability?.weeklyHours} />
                {viability?.coreValues?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Core values</p><TagList items={viability.coreValues} variant="warm" /></div>}
                {viability?.growthVectors?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Growth vectors</p><TagList items={viability.growthVectors} variant="muted" /></div>}
              </div>
            </SectionCard>
          )}

          {/* Seeking */}
          {canSee("seeking") && seeking && (
            <SectionCard icon="🧭" label="Seeking" description="What they're looking for">
              <div className="space-y-3">
                <LabelValue label="Archetype" value={seeking?.seekingArchetype} />
                <LabelValue label="Loops" value={seeking?.seekingLoops} />
                <LabelValue label="Lessons" value={seeking?.seekingLessons} />
                {seeking?.nonNegotiables?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Non-negotiables</p><TagList items={seeking.nonNegotiables} variant="warm" /></div>}
                {seeking?.niceToHaves?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Nice to haves</p><TagList items={seeking.niceToHaves} variant="muted" /></div>}
              </div>
            </SectionCard>
          )}

          {/* Safety */}
          {canSee("safety") && safety && (
            <SectionCard icon="🛡️" label="Safety & Trust" description="Consent, boundaries & accountability">
              <div className="space-y-3">
                {safety.consentFrameworks?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Consent frameworks</p><TagList items={safety.consentFrameworks} variant="warm" /></div>}
                {safety.hardBoundaries?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Hard boundaries</p><TagList items={safety.hardBoundaries} variant="muted" /></div>}
                {safety.accountability?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Accountability</p><TagList items={safety.accountability} /></div>}
                <LabelValue label="Safe sex" value={safety?.safeSexPractices} />
                <LabelValue label="Substances" value={safety?.substanceClarity} />
                {safety?.referencesAvailable && (
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">✅ References available</span>
                )}
              </div>
            </SectionCard>
          )}

          {/* Connection */}
          {canSee("connection") && connection && (
            <SectionCard icon="🤝" label="Connection Style" description="How they bond">
              <div className="space-y-3">
                <LabelValue label="Depth preference" value={connection?.depthPreference} />
                <LabelValue label="Commitment style" value={connection?.commitmentStyle} />
                {connection?.dealbreakers?.length > 0 && <div><p className="text-xs font-semibold text-foreground mb-1.5">Dealbreakers</p><TagList items={connection.dealbreakers} variant="muted" /></div>}
              </div>
            </SectionCard>
          )}

          {/* CTA for unauthenticated */}
          <div className="rounded-2xl bg-card border border-border p-5 text-center mt-2">
            <p className="text-sm font-medium text-foreground mb-1">Want to share your context?</p>
            <p className="text-xs text-muted-foreground mb-4">Build your own resonance profile on Fumbler.</p>
            <button
              onClick={() => navigate("/auth")}
              className="rounded-2xl gradient-warm px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
