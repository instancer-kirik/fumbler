import { useState, useMemo } from "react";
import { resonanceProfiles, type ResonanceProfile } from "@/data/resonance-profile";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map, List, StickyNote, Eye } from "lucide-react";
import ResonanceProfileView from "@/components/ResonanceProfileView";
import MatchDetailSheet from "@/components/matches/MatchDetailSheet";
import MatchNudges from "@/components/matches/MatchNudges";
import MatchMapView from "@/components/matches/MatchMapView";
import {
  type MatchData,
  type MatchTier,
  groupByTier,
  tierLabel,
  getFadeOpacity,
  getTimeSinceLabel,
  getSimulatedLastInteraction,
  getNudges,
  touchInteraction,
} from "@/utils/match-helpers";

const MatchesPage = () => {
  const [matchData, setMatchData] = useState<Record<string, MatchData>>({});
  const [activeProfile, setActiveProfile] = useState<ResonanceProfile | null>(null);
  const [viewingResonance, setViewingResonance] = useState<ResonanceProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  const getMatchData = (id: string): MatchData => matchData[id] || { tags: [], notes: "" };

  const toggleTag = (profileId: string, tag: string) => {
    setMatchData((prev) => {
      const current = prev[profileId] || { tags: [], notes: "" };
      const tags = current.tags.includes(tag)
        ? current.tags.filter((t) => t !== tag)
        : [...current.tags, tag];
      return { ...prev, [profileId]: { ...current, tags } };
    });
  };

  const saveNote = (profileId: string, note: string) => {
    setMatchData((prev) => {
      const current = prev[profileId] || { tags: [], notes: "" };
      return { ...prev, [profileId]: { ...current, notes: note } };
    });
  };

  const openProfile = (profile: ResonanceProfile) => {
    touchInteraction(profile.id);
    setActiveProfile(profile);
  };

  const filteredProfiles = resonanceProfiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tieredGroups = useMemo(() => groupByTier(filteredProfiles), [filteredProfiles]);
  const nudges = useMemo(
    () => getNudges(resonanceProfiles).filter((n) => !dismissedNudges.has(n.profile.id)),
    [dismissedNudges]
  );

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
        onSchedule={(p) => openProfile(p)}
        onOpen={(p) => openProfile(p)}
      />

      {/* Map View */}
      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <MatchMapView profiles={filteredProfiles} onSelect={openProfile} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Tier-grouped list */}
            {tierOrder.map((tier) => {
              const profiles = tieredGroups[tier];
              if (profiles.length === 0) return null;

              return (
                <div key={tier} className="mb-4">
                  <h2 className="px-4 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {tierLabel(tier)}
                    <span className="ml-1.5 text-[10px] font-normal">({profiles.length})</span>
                  </h2>
                  <div className="px-4 space-y-2">
                    {profiles.map((profile, i) => {
                      const data = getMatchData(profile.id);
                      const fadeOpacity = getFadeOpacity(profile.lastInteraction);
                      const timeSince = getTimeSinceLabel(profile.lastInteraction);

                      return (
                        <motion.div
                          key={profile.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: fadeOpacity, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 group relative overflow-hidden"
                        >
                          {/* Cold overlay */}
                          {tier === "cold" && (
                            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] rounded-2xl pointer-events-none z-[1]" />
                          )}

                          {/* Avatar */}
                          <button onClick={() => openProfile(profile)} className="flex-shrink-0 relative z-[2]">
                            <div className="relative">
                              <img
                                src={profile.image}
                                alt={profile.name}
                                className={`h-12 w-12 rounded-full object-cover ring-1 ring-border ${tier === "cold" ? "grayscale-[40%]" : ""}`}
                              />
                              {tier === "cold" && (
                                <div className="absolute inset-0 rounded-full bg-muted/30" />
                              )}
                            </div>
                          </button>

                          {/* Info */}
                          <button onClick={() => openProfile(profile)} className="flex-1 min-w-0 text-left relative z-[2]">
                            <div className="flex items-center gap-2">
                              <p className="font-display font-semibold text-foreground text-sm truncate">{profile.name}</p>
                              <span className="text-[10px] text-muted-foreground">{timeSince}</span>
                            </div>
                            {data.tags.length > 0 ? (
                              <div className="flex gap-1 mt-1 overflow-hidden">
                                {data.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-foreground truncate">
                                    {tag}
                                  </span>
                                ))}
                                {data.tags.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{data.tags.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.description}</p>
                            )}
                          </button>

                          {/* Rediscover button for cold matches */}
                          {tier === "cold" && (
                            <button
                              onClick={() => openProfile(profile)}
                              className="relative z-[2] rounded-full gradient-warm px-2.5 py-1 text-[10px] font-bold text-primary-foreground flex-shrink-0"
                            >
                              Rediscover
                            </button>
                          )}

                          {/* Actions for non-cold */}
                          {tier !== "cold" && (
                            <div className="flex items-center gap-1.5 flex-shrink-0 relative z-[2]">
                              {data.notes && <StickyNote className="h-3.5 w-3.5 text-primary/50" />}
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
        {activeProfile && (
          <MatchDetailSheet
            profile={activeProfile}
            matchData={getMatchData(activeProfile.id)}
            onClose={() => setActiveProfile(null)}
            onToggleTag={(tag) => toggleTag(activeProfile.id, tag)}
            onSaveNote={(note) => saveNote(activeProfile.id, note)}
            onViewResonance={() => {
              const p = activeProfile;
              setActiveProfile(null);
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
