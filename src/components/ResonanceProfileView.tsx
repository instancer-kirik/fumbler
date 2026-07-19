import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Lock, Loader2, Send, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ResonanceProfile } from "@/data/resonance-profile";
import { normalizeImportData } from "@/utils/resonance-normalizer";

type Visibility = "public" | "matches" | "express";

interface SectionVisibility {
  [sectionId: string]: Visibility;
}

interface ResonanceData {
  sectionVisibility?: SectionVisibility;

  // ── Identity surface ──────────────────────────────────────────────────────
  aura?: {
    descriptors?: string[];
    misreadAs?: string[];
    revealsOverTime?: string[];
    toneTag?: string;
  };
  aesthetics?: string[];
  aliases?: string[];
  persona?: { name?: string; description?: string } | null;
  archetypes?: Array<{
    name: string;
    definition: string;
    activationContext: string;
  }>;

  // ── Cognitive / character ─────────────────────────────────────────────────
  cognitiveStyle?: {
    attention?: string;
    patternOriented?: boolean;
    manualCountingTolerance?: string;
    systemDelegationPreference?: string;
    worksBestWith?: string;
  };
  values?: string[];
  qualities?: string[];
  introspections?: string[];
  loops?: string[];
  lessons?: string[];
  aspirations?: string[];
  sleepingDreams?: string[];
  growthVectors?: string[];

  // ── Expression ────────────────────────────────────────────────────────────
  languages?: {
    natural?: string[];
    receiveLoveThrough?: string[];
    expressLoveThrough?: string[];
    communicationStyle?: string;
    creativeExpression?: string[];
    vulnerabilityLanguage?: string;
  };
  kinks?: {
    intellectual?: string;
    relational?: string;
    intensity?: string;
    play?: string;
    avoid?: string;
  };

  // ── Interpersonal ─────────────────────────────────────────────────────────
  activationVectors?: string[];
  repulsionVectors?: string[];
  flirtInterface?: { attracts?: string[]; failsWhen?: string[] };

  glossary?: Record<string, { meaning: string; state: string }>;

  // ── Creator ───────────────────────────────────────────────────────────────
  content?: {
    categories?: string[];
    style?: string[];
    schedule?: string | null;
  };

  // ── Seeking ───────────────────────────────────────────────────────────────
  seeking?: {
    active?: boolean;
    archetypes?: string[];
    aesthetics?: string[];
    languages?: { compatibleWith?: string[]; mismatchTolerance?: string };
    qualities?: string[];
    intents?: string[];
    kinks?: string[];
    nonNegotiables?: string[];
    niceToHaves?: string[];
  };
  offering?: {
    roles?: string[];
    notes?: string;
  };
  collaborations?: Array<{
    kind?: string;
    role?: string;
    lookingFor?: string;
    notes?: string;
  }>;
  sizing?: {
    shirt?: string; pants?: string; dress?: string; shoe?: string;
    bra?: string; ring?: string; hat?: string; gloves?: string;
    waist?: string; inseam?: string; height?: string; notes?: string;
  };


  reciprocityModel?: string;
  conflictStyle?: string;

  // ── Practical ────────────────────────────────────────────────────────────
  economic?: {
    openToInvoicing?: boolean;
    contexts?: string[];
    principles?: string[];
    limits?: string[];
    kinkAlignment?: string[];
  };
  viability?: {
    availability?: {
      weeklyHours?: string;
      timezone?: string;
      asyncPreferred?: boolean;
      currentSeason?: string;
    };
    relationshipTypesAvailable?: string[];
  };
  safety?: {
    consentFrameworks?: string[];
    hardBoundaries?: string[];
    harmHistory?: string;
    accountability?: string[];
    referencesAvailable?: boolean;
    safeSexPractices?: string;
    substanceClarity?: string;
  };
  connection?: {
    channelPrimary?: string;
    channelSecondary?: string;
    contactEtiquette?: string;
    responseTimeExpectations?: string;
    frequencyOfContact?: string;
    meetingModality?: string;
    location?: string;
    willingToTravel?: string;
  };
  discovery?: {
    visibility?: string;
    contentRating?: string;
    privacyComfortLevel?: string;
    willingToBeCompared?: boolean;
    willingToHaveCompatibilityShared?: boolean;
    introduction?: {
      writtenBio?: string;
      audioIntro?: string | null;
      videoIntro?: string | null;
    };
    platforms?: Array<{ name: string; handle: string; url: string }>;
  };
  getToKnowMe?: {
    height?: string | null;
    build?: string;
    favoriteMedia?: string[];
    currentObsession?: string;
    idealWeekend?: string;
  };

  // ── Consumer Interface ────────────────────────────────────────────────────
  consumer?: { trustSignals?: string[]; distrustSignals?: string[] };

  // ── Legacy extended fields (backward compat) ──────────────────────────────
  core?: any;
  experiential?: any;
  attraction?: {
    slowBurn?: boolean;
    fastHook?: boolean;
    whatDrawsIn?: string[];
    timeline?: string;
  };
  engagement?: {
    phase1?: string;
    phase2?: string;
    phase3?: string;
    cooperationStyle?: string;
  };
  powerDynamics?: {
    enabled?: boolean;
    expressionModes?: string[];
    exploration?: string;
  };
  playPreferences?: {
    mode?: string;
    intensityProfile?: {
      emotional?: number;
      theatrical?: number;
      intellectual?: number;
    };
  };
  repulsion?: {
    hardStops?: string[];
    yellowFlags?: string[];
    patternConcerns?: string[];
  };

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
  viewerRelationship: "public" | "match" | "express",
): boolean => {
  const vis = sectionVisibility?.[sectionId] || "matches";
  if (vis === "public") return true;
  if (
    vis === "matches" &&
    (viewerRelationship === "match" || viewerRelationship === "express")
  )
    return true;
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
          <p className="font-display font-semibold text-foreground text-sm">
            {label}
          </p>
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
      <p className="font-display font-semibold text-foreground text-sm">
        {label}
      </p>
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

const TagList = ({
  items,
  variant = "default",
}: {
  items: string[];
  variant?: "default" | "warm" | "muted";
}) => {
  if (!items?.length) return null;
  const styles = {
    default: "bg-primary/10 text-foreground",
    warm: "gradient-warm text-primary-foreground",
    muted: "bg-secondary text-secondary-foreground",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}
        >
          {item.replace(/_/g, " ")}
        </span>
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
      <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
        {label}
      </span>
      <span className="text-xs text-foreground text-right">
        {value.replace(/_/g, " ")}
      </span>
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
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const ResonanceProfileView = ({
  profile,
  onClose,
  viewerRelationship: propRelationship,
  resonanceData: propData,
}: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(!propData);
  const [dbData, setDbData] = useState<ResonanceData | null>(propData || null);
  const [relationship, setRelationship] = useState<
    "public" | "match" | "express"
  >(propRelationship || "public");
  const [accessRequests, setAccessRequests] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (propData !== undefined) return;
    if (!user || !profile.id) return;

    const fetchAll = async () => {
      setLoading(true);

      const [resonanceRes, accessRes] = await Promise.all([
        (supabase.rpc as any)("get_resonance", { target_id: profile.id, viewer_id: user.id, share_key: null }),
        supabase
          .from("resonance_access_requests")
          .select("section_id, status")
          .eq("requester_id", user.id)
          .eq("target_id", profile.id),
      ]);

      if (resonanceRes.data) {
        const normalized = normalizeImportData(
          resonanceRes.data as Record<string, unknown>,
        );
        setDbData(normalized as ResonanceData);
      }

      // Derive relationship from what the RPC returned:
      // - express sections present  → express
      // - matches-level sections present (RPC omits them for public viewers) →
      //   we still need to know if we're a match for the locked-section UI.
      // Keep the access-requests query for the request map + express detection.
      const approvedSections = (accessRes.data || [])
        .filter((r: any) => r.status === "approved")
        .map((r: any) => r.section_id);
      const hasExpress = approvedSections.length > 0;

      // Check match status separately only when needed for UI (not for data access)
      let isMatch = false;
      if (!hasExpress) {
        const { data: matchData } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`,
          )
          .limit(1);
        isMatch = (matchData?.length ?? 0) > 0;
      }

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
              <p className="text-sm text-muted-foreground">
                {profile.handle} · {profile.distance}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-secondary p-2 flex-shrink-0"
            >
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
              <p className="text-sm font-medium text-primary-foreground mb-2">
                {profile.prompt}
              </p>
              <p className="text-sm text-primary-foreground/90 italic">
                "{profile.promptAnswer}"
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-sm text-foreground/80">
                {rd?.discovery?.introduction?.writtenBio || profile.bio}
              </p>
              {profile.interests?.length > 0 && (
                <div className="mt-3">
                  <TagList items={profile.interests} variant="warm" />
                </div>
              )}
            </div>

            {/* Prominent platform links — chip row */}
            {canSee("discovery") && rd?.discovery?.platforms?.length ? (
              <div className="flex flex-wrap gap-2">
                {rd.discovery.platforms.map((p) => (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>{p.name || p.handle || "link"}</span>
                    {p.handle && p.name ? (
                      <span className="text-muted-foreground">
                        @{p.handle}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            ) : null}



            {/* Get to Know Me */}
            {canSee("gtky") ? (
              rd?.getToKnowMe &&
              (rd.getToKnowMe.build ||
                rd.getToKnowMe.currentObsession ||
                rd.getToKnowMe.favoriteMedia?.length) ? (
                <SectionCard
                  icon="👤"
                  label="Get to Know Me"
                  description="Surface texture & anchors"
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {rd.getToKnowMe.height && (
                        <LabelValue
                          label="Height"
                          value={String(rd.getToKnowMe.height)}
                        />
                      )}
                      {rd.getToKnowMe.build && (
                        <LabelValue
                          label="Build"
                          value={rd.getToKnowMe.build}
                        />
                      )}
                    </div>
                    {rd.getToKnowMe.currentObsession && (
                      <LabelValue
                        label="Currently obsessed with"
                        value={rd.getToKnowMe.currentObsession}
                      />
                    )}
                    {rd.getToKnowMe.idealWeekend && (
                      <LabelValue
                        label="Ideal weekend"
                        value={rd.getToKnowMe.idealWeekend}
                      />
                    )}
                    {rd.getToKnowMe.favoriteMedia?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Favorite media
                        </p>
                        <TagList
                          items={rd.getToKnowMe.favoriteMedia}
                          variant="warm"
                        />
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("👤", "Get to Know Me", "gtky")
            )}

            {/* Aura */}
            {canSee("aura") ? (
              rd?.aura && (rd.aura.descriptors?.length || rd.aura.toneTag) ? (
                <SectionCard
                  icon="🌀"
                  label="Aura"
                  description="How they land before context"
                >
                  <div className="space-y-3">
                    {rd.aura.descriptors?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Descriptors
                        </p>
                        <TagList items={rd.aura.descriptors} variant="warm" />
                      </div>
                    ) : null}
                    {rd.aura.misreadAs?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Misread as
                        </p>
                        <TagList items={rd.aura.misreadAs} variant="muted" />
                      </div>
                    ) : null}
                    {rd.aura.revealsOverTime?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Reveals over time
                        </p>
                        <TagList items={rd.aura.revealsOverTime} />
                      </div>
                    ) : null}
                    {rd.aura.toneTag && (
                      <p className="text-xs text-muted-foreground italic">
                        "{rd.aura.toneTag}"
                      </p>
                    )}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🌀", "Aura", "aura")
            )}

            {/* Core Resonance */}
            {canSee("core") ? (
              <SectionCard
                icon="🎯"
                label="Core Resonance"
                description="Activation, repulsion & flirt interface"
                defaultOpen
              >
                {rd?.cognitiveStyle?.attention && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {rd.cognitiveStyle.attention.replace(/_/g, " ")}
                  </p>
                )}
                <div className="space-y-3">
                  {rd?.activationVectors?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        ✨ Activates
                      </p>
                      <TagList items={rd.activationVectors} variant="warm" />
                    </div>
                  ) : null}
                  {rd?.repulsionVectors?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🚫 Repels
                      </p>
                      <TagList items={rd.repulsionVectors} variant="muted" />
                    </div>
                  ) : null}
                  {rd?.flirtInterface?.attracts?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        💘 Draws in
                      </p>
                      <TagList items={rd.flirtInterface.attracts} />
                    </div>
                  ) : null}
                  {rd?.flirtInterface?.failsWhen?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        💔 Fails when
                      </p>
                      <TagList
                        items={rd.flirtInterface.failsWhen}
                        variant="muted"
                      />
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : (
              renderLocked("🎯", "Core Resonance", "core")
            )}

            {/* Consumer Interface */}
            {canSee("signals") ? (
              rd?.consumer?.trustSignals?.length ||
              rd?.consumer?.distrustSignals?.length ? (
                <SectionCard
                  icon="🔎"
                  label="Consumer Interface"
                  description="Trust & distrust signals they emit"
                >
                  <div className="space-y-3">
                    {rd?.consumer?.trustSignals?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          🟢 Trust signals
                        </p>
                        <TagList
                          items={rd.consumer.trustSignals ?? []}
                          variant="warm"
                        />
                      </div>
                    ) : null}
                    {rd?.consumer?.distrustSignals?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          🔴 Distrust signals
                        </p>
                        <TagList
                          items={rd.consumer.distrustSignals ?? []}
                          variant="muted"
                        />
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🔎", "Consumer Interface", "signals")
            )}

            {/* Qualities & Introspections */}
            {canSee("qualities") ? (
              rd?.qualities?.length || rd?.introspections?.length ? (
                <SectionCard
                  icon="✨"
                  label="Qualities"
                  description="Character traits & live introspections"
                >
                  <div className="space-y-3">
                    {rd?.qualities?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Character
                        </p>
                        <TagList items={rd.qualities} variant="warm" />
                      </div>
                    ) : null}
                    {rd?.introspections?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Currently noticing
                        </p>
                        <QuoteList items={rd.introspections} />
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("✨", "Qualities", "qualities")
            )}

            {/* Loops */}
            {canSee("loops") ? (
              rd?.loops?.length ? (
                <SectionCard
                  icon="🔄"
                  label="Loops"
                  description="Behavioral recursion"
                >
                  <QuoteList items={rd.loops} />
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🔄", "Loops", "loops")
            )}

            {/* Lessons */}
            {canSee("lessons") ? (
              rd?.lessons?.length ? (
                <SectionCard
                  icon="💡"
                  label="Lessons"
                  description="Hard-won wisdom"
                >
                  <QuoteList items={rd.lessons} />
                </SectionCard>
              ) : null
            ) : (
              renderLocked("💡", "Lessons", "lessons")
            )}

            {/* Aspirations — waking dreams */}
            {canSee("aspirations") ? (
              rd?.aspirations?.length ? (
                <SectionCard
                  icon="🌅"
                  label="Aspirations"
                  description="What he wants to build with the life he has"
                >
                  <QuoteList items={rd.aspirations} />
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🌅", "Aspirations", "aspirations")
            )}

            {/* Sleeping dreams — recorded */}
            {canSee("dreamlog") ? (
              rd?.sleepingDreams?.length ? (
                <SectionCard
                  icon="🌙"
                  label="Dream Log"
                  description="Stories his sleeping mind told him"
                >
                  <QuoteList items={rd.sleepingDreams} />
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🌙", "Dream Log", "dreamlog")
            )}

            {/* Languages */}
            {canSee("languages") ? (
              <SectionCard
                icon="💬"
                label="Languages"
                description="Expression & reception"
              >
                <div className="space-y-3">
                  {rd?.languages?.natural?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Spoken / written
                      </p>
                      <TagList items={rd.languages.natural} variant="muted" />
                    </div>
                  ) : null}
                  {rd?.languages?.receiveLoveThrough?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Receives love through
                      </p>
                      <TagList
                        items={rd.languages.receiveLoveThrough}
                        variant="warm"
                      />
                    </div>
                  ) : null}
                  {rd?.languages?.expressLoveThrough?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Expresses love through
                      </p>
                      <TagList items={rd.languages.expressLoveThrough} />
                    </div>
                  ) : null}
                  <LabelValue
                    label="Communication"
                    value={rd?.languages?.communicationStyle ?? ""}
                  />
                  <LabelValue
                    label="Vulnerability"
                    value={rd?.languages?.vulnerabilityLanguage ?? ""}
                  />
                  {rd?.languages?.creativeExpression?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Creative expression
                      </p>
                      <TagList
                        items={rd.languages.creativeExpression}
                        variant="muted"
                      />
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : (
              renderLocked("💬", "Languages", "languages")
            )}

            {/* Desires */}
            {canSee("kinks") ? (
              rd?.kinks && Object.values(rd.kinks).some(Boolean) ? (
                <SectionCard
                  icon="🔥"
                  label="Desires"
                  description="Pleasure, power & what they need"
                >
                  <div className="space-y-1">
                    <LabelValue
                      label="Intellectual"
                      value={rd.kinks.intellectual ?? ""}
                    />
                    <LabelValue
                      label="Relational"
                      value={rd.kinks.relational ?? ""}
                    />
                    <LabelValue
                      label="Intensity"
                      value={rd.kinks.intensity ?? ""}
                    />
                    <LabelValue label="Play" value={rd.kinks.play ?? ""} />
                    <LabelValue label="Avoids" value={rd.kinks.avoid ?? ""} />
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🔥", "Desires", "kinks")
            )}

            {/* Archetypes */}
            {canSee("archetypes") ? (
              rd?.archetypes?.length ? (
                <SectionCard
                  icon="🎭"
                  label="Archetypes"
                  description="Who they are by context"
                >
                  <div className="space-y-2">
                    {rd.archetypes.map((arch) => (
                      <div
                        key={arch.name}
                        className="rounded-xl bg-secondary/50 p-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {arch.name.replace(/_/g, " ")}
                        </p>
                        {arch.definition && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {arch.definition}
                          </p>
                        )}
                        {arch.activationContext && (
                          <span className="inline-block mt-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            {arch.activationContext}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🎭", "Archetypes", "archetypes")
            )}

            {/* ═══ NEW: Attraction Gradient ═══ */}
            {canSee("attraction") ? (
              rd?.attraction &&
              (rd.attraction.slowBurn ||
                rd.attraction.fastHook ||
                rd.attraction.whatDrawsIn?.length) ? (
                <SectionCard
                  icon="🧲"
                  label="Attraction Gradient"
                  description="What draws them in"
                >
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {rd.attraction.slowBurn && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">
                          🕯️ Slow Burn
                        </span>
                      )}
                      {rd.attraction.fastHook && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">
                          ⚡ Fast Hook
                        </span>
                      )}
                    </div>
                    {rd.attraction.whatDrawsIn?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          What draws in
                        </p>
                        <TagList
                          items={rd.attraction.whatDrawsIn}
                          variant="warm"
                        />
                      </div>
                    ) : null}
                    <LabelValue
                      label="Timeline"
                      value={rd.attraction.timeline || ""}
                    />
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🧲", "Attraction Gradient", "attraction")
            )}

            {/* ═══ NEW: Engagement Curve ═══ */}
            {canSee("engagement") ? (
              rd?.engagement &&
              (rd.engagement.phase1 ||
                rd.engagement.phase2 ||
                rd.engagement.phase3) ? (
                <SectionCard
                  icon="📈"
                  label="Engagement Curve"
                  description="How connection develops"
                >
                  <div className="space-y-3">
                    {rd.engagement.phase1 && (
                      <div className="rounded-xl bg-secondary/50 p-3">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-1">
                          Phase 1 — Initial
                        </p>
                        <p className="text-xs text-foreground/80">
                          {rd.engagement.phase1}
                        </p>
                      </div>
                    )}
                    {rd.engagement.phase2 && (
                      <div className="rounded-xl bg-secondary/50 p-3">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-1">
                          Phase 2 — Building
                        </p>
                        <p className="text-xs text-foreground/80">
                          {rd.engagement.phase2}
                        </p>
                      </div>
                    )}
                    {rd.engagement.phase3 && (
                      <div className="rounded-xl bg-secondary/50 p-3">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-1">
                          Phase 3 — Established
                        </p>
                        <p className="text-xs text-foreground/80">
                          {rd.engagement.phase3}
                        </p>
                      </div>
                    )}
                    <LabelValue
                      label="Cooperation"
                      value={rd.engagement.cooperationStyle || ""}
                    />
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("📈", "Engagement Curve", "engagement")
            )}

            {/* ═══ NEW: Dynamics (Power + Play) ═══ */}
            {canSee("dynamics") ? (
              rd?.powerDynamics?.enabled || rd?.playPreferences?.mode ? (
                <SectionCard
                  icon="⚔️"
                  label="Dynamics"
                  description="Power exchange & play"
                >
                  <div className="space-y-3">
                    {rd?.powerDynamics?.enabled && (
                      <>
                        {rd.powerDynamics.expressionModes?.length ? (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1.5">
                              Expression modes
                            </p>
                            <TagList items={rd.powerDynamics.expressionModes} />
                          </div>
                        ) : null}
                        {rd.powerDynamics.exploration && (
                          <LabelValue
                            label="Exploration"
                            value={rd.powerDynamics.exploration}
                          />
                        )}
                      </>
                    )}
                    {rd?.playPreferences?.mode && (
                      <LabelValue
                        label="Play mode"
                        value={rd.playPreferences.mode}
                      />
                    )}
                    {rd?.playPreferences?.intensityProfile && (
                      <div className="space-y-2">
                        <IntensityBar
                          label="Emotional"
                          value={
                            rd.playPreferences.intensityProfile.emotional ?? 50
                          }
                        />
                        <IntensityBar
                          label="Theatrical"
                          value={
                            rd.playPreferences.intensityProfile.theatrical ?? 50
                          }
                        />
                        <IntensityBar
                          label="Intellectual"
                          value={
                            rd.playPreferences.intensityProfile.intellectual ??
                            50
                          }
                        />
                      </div>
                    )}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("⚔️", "Dynamics", "dynamics")
            )}

            {/* ═══ NEW: Repulsion Vectors ═══ */}
            {canSee("repulsion") ? (
              rd?.repulsion &&
              (rd.repulsion.hardStops?.length ||
                rd.repulsion.yellowFlags?.length ||
                rd.repulsion.patternConcerns?.length) ? (
                <SectionCard
                  icon="🚧"
                  label="Repulsion Vectors"
                  description="Hard stops & flags"
                >
                  <div className="space-y-3">
                    {rd.repulsion.hardStops?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          🛑 Hard stops
                        </p>
                        <TagList
                          items={rd.repulsion.hardStops}
                          variant="muted"
                        />
                      </div>
                    ) : null}
                    {rd.repulsion.yellowFlags?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          ⚠️ Yellow flags
                        </p>
                        <TagList items={rd.repulsion.yellowFlags} />
                      </div>
                    ) : null}
                    {rd.repulsion.patternConcerns?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          🔍 Pattern concerns
                        </p>
                        <TagList items={rd.repulsion.patternConcerns} />
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🚧", "Repulsion Vectors", "repulsion")
            )}

            {/* Viability */}
            {canSee("viability") ? (
              <SectionCard
                icon="🌱"
                label="Viability"
                description="Season, capacity & open types"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <LabelValue
                      label="Season"
                      value={
                        rd?.viability?.availability?.currentSeason?.replace?.(
                          /_/g,
                          " ",
                        ) ?? ""
                      }
                    />
                    <LabelValue
                      label="Energy budget"
                      value={rd?.viability?.availability?.weeklyHours ?? ""}
                    />
                    <LabelValue
                      label="Timezone"
                      value={rd?.viability?.availability?.timezone ?? ""}
                    />
                  </div>
                  {rd?.values?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Core values
                      </p>
                      <TagList items={rd.values} variant="warm" />
                    </div>
                  ) : null}
                  {rd?.growthVectors?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Growth vectors
                      </p>
                      <TagList items={rd.growthVectors} variant="muted" />
                    </div>
                  ) : null}
                  {rd?.viability?.relationshipTypesAvailable?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Open to
                      </p>
                      <TagList
                        items={rd.viability.relationshipTypesAvailable}
                      />
                    </div>
                  ) : null}
                  {(rd?.conflictStyle || rd?.reciprocityModel) && (
                    <div className="border-t border-border pt-3 space-y-2">
                      {rd?.conflictStyle && (
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">
                            🔥 Conflict style
                          </p>
                          <p className="text-xs text-foreground/80">
                            {rd.conflictStyle.replace(/_/g, " ")}
                          </p>
                        </div>
                      )}
                      {rd?.reciprocityModel && (
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">
                            🔄 Reciprocity
                          </p>
                          <p className="text-xs text-foreground/80">
                            {rd.reciprocityModel.replace(/_/g, " ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            ) : (
              renderLocked("🌱", "Viability", "viability")
            )}

            {/* Seeking */}
            {canSee("seeking") ? (
              rd?.seeking &&
              (rd.seeking.active ||
                rd.seeking.archetypes?.length ||
                rd.seeking.intents?.length) ? (
                <SectionCard
                  icon="🧭"
                  label="Seeking"
                  description="What they're looking for"
                >
                  <div className="space-y-3">
                    {rd.seeking.archetypes?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Seeking archetype
                        </p>
                        <TagList items={rd.seeking.archetypes} variant="warm" />
                      </div>
                    ) : null}
                    {rd.seeking.intents?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Looking for
                        </p>
                        <TagList items={rd.seeking.intents} />
                      </div>
                    ) : null}
                    {rd.seeking.qualities?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Seeking qualities
                        </p>
                        <TagList items={rd.seeking.qualities} variant="warm" />
                      </div>
                    ) : null}
                    {rd.seeking.aesthetics?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Seeking aesthetic
                        </p>
                        <TagList
                          items={rd.seeking.aesthetics}
                          variant="muted"
                        />
                      </div>
                    ) : null}
                    {rd.seeking.kinks?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Seeking dynamic
                        </p>
                        <TagList items={rd.seeking.kinks} />
                      </div>
                    ) : null}
                    {rd.seeking.nonNegotiables?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Non-negotiables
                        </p>
                        <TagList
                          items={rd.seeking.nonNegotiables}
                          variant="muted"
                        />
                      </div>
                    ) : null}
                    {rd.seeking.niceToHaves?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Nice to haves
                        </p>
                        <TagList items={rd.seeking.niceToHaves} />
                      </div>
                    ) : null}
                    {rd.seeking.languages?.compatibleWith?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Love language compatibility
                        </p>
                        <TagList
                          items={rd.seeking.languages.compatibleWith}
                          variant="warm"
                        />
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🧭", "Seeking", "seeking")
            )}

            {/* Offering */}
            {canSee("offering") ? (
              rd?.offering && (rd.offering.roles?.length || rd.offering.notes) ? (
                <SectionCard
                  icon="🎭"
                  label="Offering"
                  description="Roles they're open to playing"
                >
                  <div className="space-y-3">
                    {rd.offering.roles?.length ? (
                      <TagList items={rd.offering.roles} variant="warm" />
                    ) : null}
                    {rd.offering.notes ? (
                      <p className="text-xs text-foreground/80 italic">
                        {rd.offering.notes}
                      </p>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🎭", "Offering", "offering")
            )}

            {/* Collaborations */}
            {canSee("collaborations") ? (
              rd?.collaborations?.length ? (
                <SectionCard
                  icon="🤝"
                  label="Collaborations"
                  description="Partnerships they're seeking"
                >
                  <div className="space-y-2">
                    {rd.collaborations.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-secondary/40 p-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {c.kind}
                        </p>
                        {c.role ? (
                          <p className="text-xs text-muted-foreground">
                            their role: {c.role}
                          </p>
                        ) : null}
                        {c.lookingFor ? (
                          <p className="text-xs text-foreground/80 mt-1">
                            seeking: {c.lookingFor}
                          </p>
                        ) : null}
                        {c.notes ? (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {c.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("🤝", "Collaborations", "collaborations")
            )}

            {/* Safety + Trust */}

            {canSee("safety") ? (
              <SectionCard
                icon="🛡️"
                label="Safety & Trust"
                description="Consent, boundaries & accountability"
              >
                <div className="space-y-3">
                  {rd?.safety?.consentFrameworks?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Consent frameworks
                      </p>
                      <TagList
                        items={rd.safety.consentFrameworks}
                        variant="warm"
                      />
                    </div>
                  ) : null}
                  {rd?.safety?.hardBoundaries?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Hard boundaries
                      </p>
                      <TagList
                        items={rd.safety.hardBoundaries}
                        variant="muted"
                      />
                    </div>
                  ) : null}
                  {rd?.safety?.accountability?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Accountability
                      </p>
                      <TagList items={rd.safety.accountability} />
                    </div>
                  ) : null}
                  <LabelValue
                    label="Safe sex"
                    value={rd?.safety?.safeSexPractices ?? ""}
                  />
                  <LabelValue
                    label="Substances"
                    value={rd?.safety?.substanceClarity ?? ""}
                  />
                  {rd?.safety?.harmHistory && (
                    <LabelValue
                      label="Harm history"
                      value={rd.safety.harmHistory}
                    />
                  )}
                  {rd?.safety?.referencesAvailable && (
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      ✅ References available
                    </span>
                  )}
                </div>
              </SectionCard>
            ) : (
              renderLocked("🛡️", "Safety & Trust", "safety")
            )}

            {/* Economic */}
            {canSee("economic") ? (
              rd?.economic &&
              (rd.economic.contexts?.length ||
                rd.economic.principles?.length) ? (
                <SectionCard
                  icon="💎"
                  label="Economic"
                  description="Labor, exchange & value"
                >
                  <div className="space-y-3">
                    <LabelValue
                      label="Open to invoicing"
                      value={rd.economic.openToInvoicing ? "Yes" : "No"}
                    />
                    {rd.economic.contexts?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Contexts
                        </p>
                        <TagList items={rd.economic.contexts} />
                      </div>
                    ) : null}
                    {rd.economic.principles?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Principles
                        </p>
                        <TagList
                          items={rd.economic.principles}
                          variant="muted"
                        />
                      </div>
                    ) : null}
                    {rd.economic.limits?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Limits
                        </p>
                        <TagList items={rd.economic.limits} variant="muted" />
                      </div>
                    ) : null}
                    {rd.economic.kinkAlignment?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Kink alignment
                        </p>
                        <TagList
                          items={rd.economic.kinkAlignment}
                          variant="warm"
                        />
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("💎", "Economic", "economic")
            )}

            {/* Connection */}
            {canSee("connection") ? (
              <SectionCard
                icon="📡"
                label="Connection"
                description="Logistics & preferences"
              >
                <div className="space-y-1">
                  <LabelValue
                    label="Primary channel"
                    value={rd?.connection?.channelPrimary ?? ""}
                  />
                  <LabelValue
                    label="Secondary channel"
                    value={rd?.connection?.channelSecondary ?? ""}
                  />
                  <LabelValue
                    label="Etiquette"
                    value={rd?.connection?.contactEtiquette ?? ""}
                  />
                  <LabelValue
                    label="Response time"
                    value={rd?.connection?.responseTimeExpectations ?? ""}
                  />
                  <LabelValue
                    label="Frequency"
                    value={rd?.connection?.frequencyOfContact ?? ""}
                  />
                  <LabelValue
                    label="Modality"
                    value={rd?.connection?.meetingModality ?? ""}
                  />
                  <LabelValue
                    label="Location"
                    value={rd?.connection?.location ?? ""}
                  />
                  <LabelValue
                    label="Travel"
                    value={rd?.connection?.willingToTravel ?? ""}
                  />
                </div>
              </SectionCard>
            ) : (
              renderLocked("📡", "Connection", "connection")
            )}

            {/* Content (creator) */}
            {canSee("content") ? (
              rd?.content &&
              (rd.content.categories?.length || rd.content.style?.length) ? (
                <SectionCard
                  icon="📺"
                  label="Content"
                  description="What they make"
                >
                  <div className="space-y-3">
                    {rd.content.categories?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Categories
                        </p>
                        <TagList items={rd.content.categories} variant="warm" />
                      </div>
                    ) : null}
                    {rd.content.style?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Style
                        </p>
                        <TagList items={rd.content.style} variant="muted" />
                      </div>
                    ) : null}
                    {rd.content.schedule && (
                      <LabelValue
                        label="Schedule"
                        value={String(rd.content.schedule)}
                      />
                    )}
                  </div>
                </SectionCard>
              ) : null
            ) : (
              renderLocked("📺", "Content", "content")
            )}

            {/* Glossary */}
            {canSee("glossary") &&
            rd?.glossary &&
            Object.keys(rd.glossary).length > 0 ? (
              <SectionCard
                icon="📖"
                label="Glossary"
                description="Personal lexicon"
              >
                <div className="space-y-2">
                  {Object.entries(rd.glossary).map(([key, entry]) => (
                    <div key={key} className="rounded-xl bg-secondary/50 p-3">
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
                  ))}
                </div>
              </SectionCard>
            ) : canSee("glossary") ? null : (
              renderLocked("📖", "Glossary", "glossary")
            )}

            {/* Discovery */}
            {canSee("discovery") && rd?.discovery ? (
              <SectionCard
                icon="🔭"
                label="Discovery"
                description="How they want to be found"
              >
                <div className="space-y-3">
                  {rd.discovery.contentRating && (
                    <LabelValue
                      label="Content rating"
                      value={rd.discovery.contentRating}
                    />
                  )}
                  {rd.discovery.introduction?.writtenBio && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Bio
                      </p>
                      <p className="text-xs text-foreground/80 italic">
                        "{rd.discovery.introduction.writtenBio}"
                      </p>
                    </div>
                  )}
                  {rd.discovery.platforms?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Platforms
                      </p>
                      <div className="space-y-1.5">
                        {rd.discovery.platforms.map((p) => (
                          <a
                            key={p.url}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-primary hover:bg-secondary transition-colors"
                          >
                            <span className="font-medium">
                              {p.name || p.handle}
                            </span>
                            {p.handle && p.name && (
                              <span className="text-muted-foreground">
                                @{p.handle}
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {rd.discovery.introduction?.audioIntro && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🎙️ Audio intro
                      </p>
                      <audio
                        controls
                        className="w-full"
                        src={String(rd.discovery.introduction.audioIntro)}
                      />
                    </div>
                  )}
                  {rd.discovery.introduction?.videoIntro && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🎬 Video intro
                      </p>
                      <video
                        controls
                        className="w-full rounded-xl"
                        src={rd.discovery.introduction?.videoIntro ?? undefined}
                      />
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
