import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, ChevronRight, Share2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeImportData } from "@/utils/resonance-normalizer";

// Mapping from sectionVisibility keys to the top-level data keys the RPC emits.
// The RPC only includes keys for sections the viewer is granted access to,
// so we capture which keys were present in the raw response before normalization.
const SECTION_KEYS: Record<string, string[]> = {
  gtky: ["getToKnowMe"],
  aura: ["aura", "aesthetics", "aliases", "persona"],
  core: ["activationVectors", "repulsionVectors", "flirtInterface"],
  signals: ["consumer", "trustSignals", "distrustSignals"],
  qualities: ["qualities", "introspections", "values"],
  loops: ["loops"],
  lessons: ["lessons"],
  languages: ["languages"],
  kinks: ["kinks"],
  archetypes: ["archetypes"],
  attraction: ["attraction"],
  engagement: ["engagement"],
  dynamics: ["powerDynamics", "playPreferences"],
  repulsion: ["repulsion"],
  viability: ["viability"],
  seeking: ["seeking"],
  safety: ["safety"],
  economic: ["economic"],
  connection: ["connection"],
  content: ["content"],
  glossary: ["glossary"],
  discovery: ["discovery"],
};

interface PublicProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  resonance_data: any;
  granted_keys?: Set<string>;
}

interface ViewerState {
  id: string;
  email?: string;
  username?: string;
}

const TagList = ({
  items,
  variant = "default",
}: {
  items?: string[];
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

const LabelValue = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => {
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
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
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

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shareKey = searchParams.get("key");
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [copied, setCopied] = useState(false);

  const _base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const profileUrl = shareKey
    ? `${window.location.origin}${_base}/u/${username}?key=${shareKey}`
    : `${window.location.origin}${_base}/u/${username}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${username}'s fumbler profile`,
        url: profileUrl,
      });
    } else {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      // First fetch the non-sensitive profile columns (no resonance_data)
      let { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, age")
        .eq("username", username)
        .maybeSingle();

      // If direct lookup found nothing, fall back to the identity RPC:
      // the profile may exist but be `is_public=false`, in which case RLS
      // hides it from anon. We still want to distinguish "private" from
      // "doesn't exist" so selective visibility can render partial content.
      if (!data && !error) {
        const { data: identity } = await (supabase.rpc as any)(
          "get_public_identity",
          { _username: username },
        );
        const row = Array.isArray(identity) ? identity[0] : identity;
        if (row) {
          data = {
            id: row.id,
            full_name: row.full_name,
            username: row.username,
            avatar_url: row.avatar_url,
            bio: row.bio,
            age: row.age,
          } as any;
          if (row.is_public === false) setIsPrivate(true);
        }
      }

      if (!data || error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch resonance_data through the RPC which enforces visibility.
      // Always pass all 3 params to avoid PostgREST PGRST203 overload ambiguity.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const viewerId = session?.user?.id ?? null;
      let viewerUsername = null;
      let matchStatus = false;

      if (viewerId) {
        // Get viewer username
        const { data: viewerData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", viewerId)
          .maybeSingle();
        if (viewerData) viewerUsername = viewerData.username;

        // Check match
        const { data: matchData } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user1_id.eq.${viewerId},user2_id.eq.${data.id}),and(user1_id.eq.${data.id},user2_id.eq.${viewerId})`
          )
          .limit(1);
        matchStatus = (matchData?.length ?? 0) > 0;
      }

      setViewer(viewerId ? { id: viewerId, email: session?.user?.email, username: viewerUsername } : null);
      setIsMatch(matchStatus);

      const { data: resonanceData } = await (supabase.rpc as any)(
        "get_resonance",
        {
          target_id: data.id,
          viewer_id: viewerId,
          share_key: shareKey ?? null,
        },
      );

      const profileData = { ...data } as any;
      if (resonanceData) {
        const rawRes = resonanceData as Record<string, unknown>;
        profileData.granted_keys = new Set(Object.keys(rawRes));
        profileData.resonance_data = normalizeImportData(rawRes);
      }
      setProfile(profileData);
      setLoading(false);
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, shareKey]);

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
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Profile not found
        </h1>
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

  // rd is now normalized v0.9 flat format
  const rd = profile.resonance_data as any;
  // grantedKeys = raw top-level keys the RPC returned (= sections viewer can see)
  const grantedKeys: Set<string> = profile.granted_keys ?? new Set();
  const canSee = (id: string): boolean => {
    const keys = SECTION_KEYS[id];
    return keys ? keys.some((k) => grantedKeys.has(k)) : false;
  };
  const hasAnySectionData =
    rd && Object.keys(SECTION_KEYS).some((id) => canSee(id));

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background px-4 pt-6 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => {
            // If there's browser history, go back; otherwise go to discover (signed in) or landing
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              supabase.auth.getSession().then(({ data: { session } }) => {
                navigate(session?.user ? "/discover" : "/");
              });
            }
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-xl gradient-warm px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "Share profile"}
        </button>
      </div>

      {viewer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex justify-center"
        >
          <div className="text-xs font-medium px-4 py-2 rounded-full bg-secondary/80 text-secondary-foreground flex items-center gap-2 border border-border/50 shadow-sm backdrop-blur-sm">
            <span className="opacity-80">Signed in as</span>
            <span className="font-bold text-foreground">
              @{viewer.username || viewer.email?.split('@')[0] || "Unknown"}
            </span>
            {isMatch && (
              <>
                <span className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-primary font-bold">Matched</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="h-24 w-24 overflow-hidden rounded-full gradient-warm p-[3px] mb-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || ""}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-2xl font-display text-muted-foreground">
              {profile.full_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">
          {profile.full_name || "Anonymous"}
          {profile.age ? `, ${profile.age}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="mt-2 text-sm text-foreground/80 text-center max-w-xs">
            {profile.bio}
          </p>
        )}
      </motion.div>

      {/* Resonance sections — all using v0.9 flat keys */}
      {!rd || !hasAnySectionData ? (
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isPrivate
              ? "This profile is private. Sign in and match to see more."
              : viewer
                ? "No sections shared with you yet."
                : "No public resonance sections yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bio from discovery */}
          {canSee("discovery") && rd?.discovery?.introduction?.writtenBio && (
            <div className="rounded-2xl gradient-warm p-4">
              <p className="text-sm text-primary-foreground/90">
                {rd.discovery.introduction.writtenBio}
              </p>
            </div>
          )}

          {/* Get to Know Me */}
          {canSee("gtky") &&
            rd?.getToKnowMe &&
            (rd.getToKnowMe.build ||
              rd.getToKnowMe.currentObsession ||
              rd.getToKnowMe.idealWeekend) && (
              <SectionCard
                icon="👤"
                label="Get to Know Me"
                description="Surface texture & anchors"
                defaultOpen
              >
                <div className="space-y-3">
                  <LabelValue label="Build" value={rd.getToKnowMe.build} />
                  <LabelValue
                    label="Current obsession"
                    value={rd.getToKnowMe.currentObsession}
                  />
                  <LabelValue
                    label="Ideal weekend"
                    value={rd.getToKnowMe.idealWeekend}
                  />
                  {rd.getToKnowMe.favoriteMedia?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Favorite media
                      </p>
                      <TagList items={rd.getToKnowMe.favoriteMedia} />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Aura */}
          {canSee("aura") &&
            rd?.aura &&
            (rd.aura.descriptors?.length > 0 || rd.aura.toneTag) && (
              <SectionCard
                icon="🌀"
                label="Aura"
                description="How they land before context"
              >
                <div className="space-y-3">
                  {rd.aura.descriptors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Descriptors
                      </p>
                      <TagList items={rd.aura.descriptors} variant="warm" />
                    </div>
                  )}
                  {rd.aura.misreadAs?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Misread as
                      </p>
                      <TagList items={rd.aura.misreadAs} variant="muted" />
                    </div>
                  )}
                  {rd.aura.revealsOverTime?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Reveals over time
                      </p>
                      <TagList items={rd.aura.revealsOverTime} />
                    </div>
                  )}
                  <LabelValue label="Tone tag" value={rd.aura.toneTag} />
                </div>
              </SectionCard>
            )}

          {/* Core Resonance — flat activationVectors + flirtInterface */}
          {canSee("core") &&
            (rd?.activationVectors?.length > 0 ||
              rd?.flirtInterface?.attracts?.length > 0) && (
              <SectionCard
                icon="🎯"
                label="Core Resonance"
                description="How they engage"
                defaultOpen
              >
                <div className="space-y-3">
                  {rd.activationVectors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        ✨ Activates
                      </p>
                      <TagList items={rd.activationVectors} variant="warm" />
                    </div>
                  )}
                  {rd.flirtInterface?.attracts?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        💘 Flirt Interface
                      </p>
                      <TagList items={rd.flirtInterface.attracts} />
                    </div>
                  )}
                  {rd.flirtInterface?.failsWhen?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        💔 Fails when
                      </p>
                      <TagList
                        items={rd.flirtInterface.failsWhen}
                        variant="muted"
                      />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Trust+Consumer */}
          {canSee("signals") &&
            rd?.consumer &&
            (rd.consumer.trustSignals?.length > 0 ||
              rd.consumer.distrustSignals?.length > 0) && (
              <SectionCard
                icon="🔎"
                label="Trust+Consumer"
                description="Trust & distrust signals"
              >
                <div className="space-y-3">
                  {rd.consumer.trustSignals?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🟢 Trust signals
                      </p>
                      <TagList
                        items={rd.consumer.trustSignals}
                        variant="warm"
                      />
                    </div>
                  )}
                  {rd.consumer.distrustSignals?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🔴 Distrust signals
                      </p>
                      <TagList
                        items={rd.consumer.distrustSignals}
                        variant="muted"
                      />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Qualities */}
          {canSee("qualities") &&
            (rd?.qualities?.length > 0 ||
              rd?.values?.length > 0 ||
              rd?.introspections?.length > 0) && (
              <SectionCard
                icon="✨"
                label="Qualities"
                description="Character traits"
              >
                <div className="space-y-3">
                  {rd.qualities?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Qualities
                      </p>
                      <TagList items={rd.qualities} variant="warm" />
                    </div>
                  )}
                  {rd.values?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Values
                      </p>
                      <TagList items={rd.values} />
                    </div>
                  )}
                  {rd.introspections?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Introspections
                      </p>
                      <QuoteList items={rd.introspections} />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Loops */}
          {canSee("loops") && rd?.loops?.length > 0 && (
            <SectionCard
              icon="🔄"
              label="Loops"
              description="Behavioral recursion"
            >
              <QuoteList items={rd.loops} />
            </SectionCard>
          )}

          {/* Lessons */}
          {canSee("lessons") && rd?.lessons?.length > 0 && (
            <SectionCard
              icon="💡"
              label="Lessons"
              description="Integrated wisdom"
            >
              <QuoteList items={rd.lessons} />
            </SectionCard>
          )}

          {/* Languages */}
          {canSee("languages") && rd?.languages && (
            <SectionCard
              icon="💬"
              label="Languages"
              description="Expression & reception"
            >
              <div className="space-y-3">
                {rd.languages.natural?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Natural languages
                    </p>
                    <TagList items={rd.languages.natural} />
                  </div>
                )}
                {rd.languages.receiveLoveThrough?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Receives love through
                    </p>
                    <TagList
                      items={rd.languages.receiveLoveThrough}
                      variant="warm"
                    />
                  </div>
                )}
                {rd.languages.expressLoveThrough?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Expresses love through
                    </p>
                    <TagList items={rd.languages.expressLoveThrough} />
                  </div>
                )}
                <LabelValue
                  label="Communication"
                  value={rd.languages.communicationStyle}
                />
                <LabelValue
                  label="Vulnerability"
                  value={rd.languages.vulnerabilityLanguage}
                />
                {rd.languages.creativeExpression?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Creative expression
                    </p>
                    <TagList
                      items={rd.languages.creativeExpression}
                      variant="muted"
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Kinks / Desires */}
          {canSee("kinks") &&
            rd?.kinks &&
            (rd.kinks.intellectual || rd.kinks.relational || rd.kinks.play) && (
              <SectionCard
                icon="🔥"
                label="Desires"
                description="Pleasure & power"
              >
                <div className="space-y-3">
                  <LabelValue
                    label="Intellectual"
                    value={rd.kinks.intellectual}
                  />
                  <LabelValue label="Relational" value={rd.kinks.relational} />
                  <LabelValue label="Intensity" value={rd.kinks.intensity} />
                  <LabelValue label="Play" value={rd.kinks.play} />
                  <LabelValue label="Avoids" value={rd.kinks.avoid} />
                </div>
              </SectionCard>
            )}

          {/* Archetypes */}
          {canSee("archetypes") && rd?.archetypes?.length > 0 && (
            <SectionCard
              icon="🎭"
              label="Archetypes"
              description="Who they are by context"
            >
              <div className="space-y-2">
                {rd.archetypes.map((arch: any, i: number) => (
                  <div
                    key={arch.name || i}
                    className="rounded-xl bg-secondary/50 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {arch.name}
                    </p>
                    {arch.definition && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {arch.definition}
                      </p>
                    )}
                    {arch.activationContext && (
                      <p className="text-xs text-primary/70 mt-0.5">
                        → {arch.activationContext}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Attraction */}
          {canSee("attraction") &&
            rd?.attraction &&
            (rd.attraction.slowBurn ||
              rd.attraction.fastHook ||
              rd.attraction.whatDrawsIn?.length) && (
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
                  {rd.attraction.whatDrawsIn?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        What draws in
                      </p>
                      <TagList
                        items={rd.attraction.whatDrawsIn}
                        variant="warm"
                      />
                    </div>
                  )}
                  <LabelValue label="Timeline" value={rd.attraction.timeline} />
                </div>
              </SectionCard>
            )}

          {/* Engagement Curve */}
          {canSee("engagement") &&
            rd?.engagement &&
            (rd.engagement.phase1 ||
              rd.engagement.phase2 ||
              rd.engagement.phase3) && (
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
                    value={rd.engagement.cooperationStyle}
                  />
                </div>
              </SectionCard>
            )}

          {/* Dynamics */}
          {canSee("dynamics") &&
            (rd?.powerDynamics?.enabled || rd?.playPreferences?.mode) && (
              <SectionCard
                icon="⚔️"
                label="Dynamics"
                description="Power exchange & play"
              >
                <div className="space-y-3">
                  {rd.powerDynamics?.enabled &&
                    rd.powerDynamics.expressionModes?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          Expression modes
                        </p>
                        <TagList items={rd.powerDynamics.expressionModes} />
                      </div>
                    )}
                  {rd.powerDynamics?.exploration && (
                    <LabelValue
                      label="Exploration"
                      value={rd.powerDynamics.exploration}
                    />
                  )}
                  {rd.playPreferences?.mode && (
                    <LabelValue
                      label="Play mode"
                      value={rd.playPreferences.mode}
                    />
                  )}
                  {rd.playPreferences?.intensityProfile && (
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
                          rd.playPreferences.intensityProfile.intellectual ?? 50
                        }
                      />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Repulsion Vectors */}
          {canSee("repulsion") &&
            (rd?.repulsionVectors?.length > 0 ||
              rd?.repulsion?.hardStops?.length > 0) && (
              <SectionCard
                icon="🚧"
                label="Repulsion Vectors"
                description="Hard stops & flags"
              >
                <div className="space-y-3">
                  {rd.repulsionVectors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🚫 Repels
                      </p>
                      <TagList items={rd.repulsionVectors} variant="muted" />
                    </div>
                  )}
                  {rd.repulsion?.hardStops?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🛑 Hard stops
                      </p>
                      <TagList items={rd.repulsion.hardStops} variant="muted" />
                    </div>
                  )}
                  {rd.repulsion?.yellowFlags?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        ⚠️ Yellow flags
                      </p>
                      <TagList items={rd.repulsion.yellowFlags} />
                    </div>
                  )}
                  {rd.repulsion?.patternConcerns?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        🔍 Pattern concerns
                      </p>
                      <TagList items={rd.repulsion.patternConcerns} />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Availability */}
          {canSee("viability") && rd?.viability && (
            <SectionCard
              icon="🌱"
              label="Availability & Rhythm"
              description="Season, capacity & how they show up"
            >
              <div className="space-y-3">
                <LabelValue
                  label="Season"
                  value={rd.viability.availability?.currentSeason}
                />
                <LabelValue
                  label="Energy budget"
                  value={rd.viability.availability?.weeklyHours}
                />
                <LabelValue
                  label="Timezone"
                  value={rd.viability.availability?.timezone}
                />
                {rd.viability.relationshipTypesAvailable?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Relationship types
                    </p>
                    <TagList
                      items={rd.viability.relationshipTypesAvailable}
                      variant="warm"
                    />
                  </div>
                )}
                <LabelValue label="Conflict style" value={rd.conflictStyle} />
                <LabelValue label="Reciprocity" value={rd.reciprocityModel} />
                {rd.growthVectors?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Growth vectors
                    </p>
                    <TagList items={rd.growthVectors} variant="muted" />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Seeking */}
          {canSee("seeking") && rd?.seeking && (
            <SectionCard
              icon="🧭"
              label="Seeking"
              description="What they're looking for"
            >
              <div className="space-y-3">
                {rd.seeking.archetypes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Seeking archetypes
                    </p>
                    <TagList items={rd.seeking.archetypes} variant="warm" />
                  </div>
                )}
                {rd.seeking.kinks?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Seeking kinks
                    </p>
                    <TagList items={rd.seeking.kinks} />
                  </div>
                )}
                {rd.seeking.nonNegotiables?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Non-negotiables
                    </p>
                    <TagList items={rd.seeking.nonNegotiables} variant="warm" />
                  </div>
                )}
                {rd.seeking.niceToHaves?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Nice to haves
                    </p>
                    <TagList items={rd.seeking.niceToHaves} variant="muted" />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Safety */}
          {canSee("safety") && rd?.safety && (
            <SectionCard
              icon="🛡️"
              label="Safety & Trust"
              description="Consent, boundaries & accountability"
            >
              <div className="space-y-3">
                {rd.safety.consentFrameworks?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Consent frameworks
                    </p>
                    <TagList
                      items={rd.safety.consentFrameworks}
                      variant="warm"
                    />
                  </div>
                )}
                {rd.safety.hardBoundaries?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Hard boundaries
                    </p>
                    <TagList items={rd.safety.hardBoundaries} variant="muted" />
                  </div>
                )}
                {rd.safety.accountability?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Accountability
                    </p>
                    <TagList items={rd.safety.accountability} />
                  </div>
                )}
                <LabelValue
                  label="Safe sex"
                  value={rd.safety.safeSexPractices}
                />
                <LabelValue
                  label="Substances"
                  value={rd.safety.substanceClarity}
                />
                {rd.safety.referencesAvailable && (
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    ✅ References available
                  </span>
                )}
              </div>
            </SectionCard>
          )}

          {/* Economic */}
          {canSee("economic") &&
            rd?.economic &&
            (rd.economic.contexts?.length > 0 ||
              rd.economic.principles?.length > 0) && (
              <SectionCard
                icon="💎"
                label="Economic"
                description="Labor & exchange"
              >
                <div className="space-y-3">
                  {rd.economic.openToInvoicing && (
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      Open to invoicing
                    </span>
                  )}
                  {rd.economic.contexts?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Contexts
                      </p>
                      <TagList items={rd.economic.contexts} />
                    </div>
                  )}
                  {rd.economic.principles?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Principles
                      </p>
                      <TagList items={rd.economic.principles} variant="warm" />
                    </div>
                  )}
                  {rd.economic.limits?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Limits
                      </p>
                      <TagList items={rd.economic.limits} variant="muted" />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Connection */}
          {canSee("connection") && rd?.connection && (
            <SectionCard
              icon="📡"
              label="Connection"
              description="Logistics & preferences"
            >
              <div className="space-y-3">
                <LabelValue
                  label="Primary channel"
                  value={rd.connection.channelPrimary}
                />
                <LabelValue
                  label="Secondary channel"
                  value={rd.connection.channelSecondary}
                />
                <LabelValue
                  label="Contact etiquette"
                  value={rd.connection.contactEtiquette}
                />
                <LabelValue
                  label="Response time"
                  value={rd.connection.responseTimeExpectations}
                />
                <LabelValue
                  label="Frequency"
                  value={rd.connection.frequencyOfContact}
                />
                <LabelValue
                  label="Meeting"
                  value={rd.connection.meetingModality}
                />
                <LabelValue label="Location" value={rd.connection.location} />
                <LabelValue
                  label="Travel"
                  value={rd.connection.willingToTravel}
                />
              </div>
            </SectionCard>
          )}

          {/* Content */}
          {canSee("content") &&
            rd?.content &&
            (rd.content.categories?.length > 0 ||
              rd.content.style?.length > 0) && (
              <SectionCard
                icon="📺"
                label="Content"
                description="What they make"
              >
                <div className="space-y-3">
                  {rd.content.categories?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Categories
                      </p>
                      <TagList items={rd.content.categories} />
                    </div>
                  )}
                  {rd.content.style?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">
                        Style
                      </p>
                      <TagList items={rd.content.style} variant="muted" />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

          {/* Glossary */}
          {canSee("glossary") &&
            rd?.glossary &&
            Object.keys(rd.glossary).length > 0 && (
              <SectionCard
                icon="📖"
                label="Glossary"
                description="Personal lexicon"
              >
                <div className="space-y-2">
                  {Object.entries(rd.glossary).map(
                    ([key, entry]: [string, any]) => (
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
                    ),
                  )}
                </div>
              </SectionCard>
            )}

          {/* Discovery — platforms */}
          {canSee("discovery") && rd?.discovery?.platforms?.length > 0 && (
            <SectionCard
              icon="🔭"
              label="Discovery"
              description="How to find them"
            >
              <div className="space-y-2">
                {rd.discovery.platforms.map((p: any, i: number) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-secondary/50 p-3 hover:bg-secondary/70 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {p.name || p.url}
                    </p>
                    {p.handle && (
                      <p className="text-xs text-muted-foreground">
                        @{p.handle}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </SectionCard>
          )}

          {/* CTA for unauthenticated */}
          <div className="rounded-2xl bg-card border border-border p-5 text-center mt-2">
            <p className="text-sm font-medium text-foreground mb-1">
              Want to share your context?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Build your own resonance profile on Fumbler.
            </p>
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
