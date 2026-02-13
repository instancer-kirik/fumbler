import { useState, useMemo } from "react";
import { type ResonanceProfile } from "@/data/resonance-profile";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map, List, StickyNote, Eye } from "lucide-react";
import ResonanceProfileView from "@/components/ResonanceProfileView";
import MatchDetailSheet from "@/components/matches/MatchDetailSheet";
import MatchNudges from "@/components/matches/MatchNudges";
import MatchMapView from "@/components/matches/MatchMapView";
import {
  type MatchTier,
  tierLabel,
  getFadeOpacity,
  getTimeSinceLabel,
  getTier,
} from "@/utils/match-helpers";
import { useMatches, useUpdateMatch, type MatchWithProfile } from "@/hooks/use-matches";

// Group matches by tier using last_interaction_at from DB
function groupMatchesByTier(
  matches: MatchWithProfile[]
): Record<MatchTier, MatchWithProfile[]> {
  const grouped: Record<MatchTier, MatchWithProfile[]> = { hot: [], warming: [], cold: [] };
  for (const m of matches) {
    const ts = new Date(m.match.last_interaction_at).getTime();
    grouped[getTier(ts)].push(m);
  }
  for (const tier of Object.keys(grouped) as MatchTier[]) {
    grouped[tier].sort(
      (a, b) =>
        new Date(b.match.last_interaction_at).getTime() -
        new Date(a.match.last_interaction_at).getTime()
    );
  }
  return grouped;
}

const MatchesPage = () => {
  const { data: matches = [], isLoading } = useMatches();
  const updateMatch = useUpdateMatch();
  const [activeMatch, setActiveMatch] = useState<MatchWithProfile | null>(null);
  const [viewingResonance, setViewingResonance] = useState<ResonanceProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  const filteredMatches = matches.filter((m) =>
    m.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tieredGroups = useMemo(() => groupMatchesByTier(filteredMatches), [filteredMatches]);

  const openMatch = (m: MatchWithProfile) => {
    updateMatch.mutate({
      matchId: m.match.id,
      updates: { last_interaction_at: new Date().toISOString() },
    });
    setActiveMatch(m);
  };

  const toggleTag = (matchId: string, currentTags: string[], tag: string) => {
    const tags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateMatch.mutate({ matchId, updates: { tags } });
  };

  const saveNote = (matchId: string, note: string) => {
    updateMatch.mutate({ matchId, updates: { notes: note } });
  };

  // Build nudges from cold/warming matches
  const nudges = useMemo(() => {
    const DAY_MS = 86400000;
    return matches
      .map((m) => {
        const daysSince = Math.floor(
          (Date.now() - new Date(m.match.last_interaction_at).getTime()) / DAY_MS
        );
        if (daysSince < 3) return null;
        const message =
          daysSince < 5
            ? `You matched with ${m.profile.name} ${daysSince} days ago — don't let this one fade!`
            : daysSince < 10
            ? `${m.profile.name} is going cold... maybe schedule a fumble?`
            : `Remember ${m.profile.name}? It's been ${daysSince} days. Rediscover or let go?`;
        return { profile: m.profile, daysSince, message, matchWithProfile: m };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null && !dismissedNudges.has(n.profile.id))
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [matches, dismissedNudges]);

  const tierOrder: MatchTier[] = ["hot", "warming", "cold"];

  return (
    <div className="min-h-screen bg-background pb-24 pt-6">
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Matches</h1>
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-xl p-2 transition-all ${viewMode === "list" ? "gradient-warm" : "bg-secondary"}`}
            >
              <List className={`h-4 w-4 ${viewMode === "list" ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`rounded-xl p-2 transition-all ${viewMode === "map" ? "gradient-warm" : "bg-secondary"}`}
            >
              <Map className={`h-4 w-4 ${viewMode === "map" ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matches..."
            className="w-full rounded-xl bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Nudges */}
      <MatchNudges
        nudges={nudges}
        onDismiss={(id) => setDismissedNudges((prev) => new Set([...prev, id]))}
        onSchedule={(p) => {
          const m = matches.find((x) => x.profile.id === p.id);
          if (m) openMatch(m);
        }}
        onOpen={(p) => {
          const m = matches.find((x) => x.profile.id === p.id);
          if (m) openMatch(m);
        }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-muted-foreground text-sm">Loading matches...</div>
        </div>
      )}

      {/* Map View */}
      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div key="map" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <MatchMapView
              profiles={filteredMatches.map((m) => m.profile)}
              onSelect={(p) => {
                const m = matches.find((x) => x.profile.id === p.id);
                if (m) openMatch(m);
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {tierOrder.map((tier) => {
              const tierMatches = tieredGroups[tier];
              if (tierMatches.length === 0) return null;

              return (
                <div key={tier} className="mb-4">
                  <h2 className="px-4 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {tierLabel(tier)}
                    <span className="ml-1.5 text-[10px] font-normal">({tierMatches.length})</span>
                  </h2>
                  <div className="px-4 space-y-2">
                    {tierMatches.map((mwp, i) => {
                      const { match, profile } = mwp;
                      const lastTs = new Date(match.last_interaction_at).getTime();
                      const fadeOpacity = getFadeOpacity(lastTs);
                      const timeSince = getTimeSinceLabel(lastTs);

                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: fadeOpacity, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 group relative overflow-hidden"
                        >
                          {tier === "cold" && (
                            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] rounded-2xl pointer-events-none z-[1]" />
                          )}

                          <button onClick={() => openMatch(mwp)} className="flex-shrink-0 relative z-[2]">
                            <div className="relative">
                              <img
                                src={profile.image}
                                alt={profile.name}
                                className={`h-12 w-12 rounded-full object-cover ring-1 ring-border ${tier === "cold" ? "grayscale-[40%]" : ""}`}
                              />
                              {tier === "cold" && <div className="absolute inset-0 rounded-full bg-muted/30" />}
                            </div>
                          </button>

                          <button onClick={() => openMatch(mwp)} className="flex-1 min-w-0 text-left relative z-[2]">
                            <div className="flex items-center gap-2">
                              <p className="font-display font-semibold text-foreground text-sm truncate">{profile.name}</p>
                              <span className="text-[10px] text-muted-foreground">{timeSince}</span>
                            </div>
                            {match.tags.length > 0 ? (
                              <div className="flex gap-1 mt-1 overflow-hidden">
                                {match.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-foreground truncate">
                                    {tag}
                                  </span>
                                ))}
                                {match.tags.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{match.tags.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.description}</p>
                            )}
                          </button>

                          {tier === "cold" && (
                            <button
                              onClick={() => openMatch(mwp)}
                              className="relative z-[2] rounded-full gradient-warm px-2.5 py-1 text-[10px] font-bold text-primary-foreground flex-shrink-0"
                            >
                              Rediscover
                            </button>
                          )}

                          {tier !== "cold" && (
                            <div className="flex items-center gap-1.5 flex-shrink-0 relative z-[2]">
                              {match.notes && <StickyNote className="h-3.5 w-3.5 text-primary/50" />}
                              <button
                                onClick={() => setViewingResonance(profile)}
                                className="rounded-full bg-secondary p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="View resonance profile"
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Detail Sheet */}
      <AnimatePresence>
        {activeMatch && (
          <MatchDetailSheet
            profile={activeMatch.profile}
            match={activeMatch.match}
            amUser1={activeMatch.amUser1}
            onClose={() => setActiveMatch(null)}
            onToggleTag={(tag) =>
              toggleTag(activeMatch.match.id, activeMatch.match.tags, tag)
            }
            onSaveNote={(note) => saveNote(activeMatch.match.id, note)}
            onViewResonance={() => {
              const p = activeMatch.profile;
              setActiveMatch(null);
              setTimeout(() => setViewingResonance(p), 200);
            }}
          />
        )}
      </AnimatePresence>

      {/* Full Resonance Profile View */}
      <AnimatePresence>
        {viewingResonance && (
          <ResonanceProfileView
            profile={viewingResonance}
            onClose={() => setViewingResonance(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchesPage;
