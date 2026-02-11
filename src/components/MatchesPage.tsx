import { useState } from "react";
import { resonanceProfiles, type ResonanceProfile } from "@/data/resonance-profile";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag, StickyNote, Check, Eye, Search } from "lucide-react";
import ResonanceProfileView from "@/components/ResonanceProfileView";

interface MatchData {
  tags: string[];
  notes: string;
}

const defaultTags = ["Met IRL", "Great Convo", "Funny", "Vibes ✨", "Follow Up", "Coffee Date"];

const MatchesPage = () => {
  const [matchData, setMatchData] = useState<Record<string, MatchData>>({});
  const [activeProfile, setActiveProfile] = useState<ResonanceProfile | null>(null);
  const [viewingResonance, setViewingResonance] = useState<ResonanceProfile | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const addCustomTag = (profileId: string) => {
    if (!customTag.trim()) return;
    toggleTag(profileId, customTag.trim());
    setCustomTag("");
  };

  const saveNote = (profileId: string) => {
    setMatchData((prev) => {
      const current = prev[profileId] || { tags: [], notes: "" };
      return { ...prev, [profileId]: { ...current, notes: noteText } };
    });
    setEditingNote(false);
  };

  const openProfile = (profile: ResonanceProfile) => {
    setActiveProfile(profile);
    setNoteText(getMatchData(profile.id).notes);
    setShowTagPicker(false);
    setEditingNote(false);
  };

  const filteredProfiles = resonanceProfiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24 pt-6">
      {/* Header */}
      <div className="px-4 mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">
          Matches
        </h1>
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

      {/* New Matches — Horizontal */}
      <div className="mb-5">
        <h2 className="px-4 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          New Matches
        </h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {resonanceProfiles.slice(0, 3).map((profile, i) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => openProfile(profile)}
              className="flex-shrink-0 group"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-primary/30 group-hover:ring-primary transition-all">
                <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <p className="absolute bottom-1.5 left-0 right-0 text-center text-[11px] font-bold text-card">
                  {profile.name}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Conversations
        </h2>
        <div className="space-y-2">
          {filteredProfiles.map((profile, i) => {
            const data = getMatchData(profile.id);
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 group"
              >
                {/* Avatar + tap to open detail */}
                <button onClick={() => openProfile(profile)} className="flex-shrink-0">
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
                  />
                </button>

                {/* Info */}
                <button onClick={() => openProfile(profile)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-foreground text-sm truncate">{profile.name}</p>
                    <span className="text-[10px] text-muted-foreground">{profile.distance}</span>
                  </div>
                  {data.tags.length > 0 ? (
                    <div className="flex gap-1 mt-1 overflow-hidden">
                      {data.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-foreground truncate"
                        >
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

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {data.notes && <StickyNote className="h-3.5 w-3.5 text-primary/50" />}
                  <button
                    onClick={() => setViewingResonance(profile)}
                    className="rounded-full bg-secondary p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View resonance profile"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Match Detail Sheet */}
      <AnimatePresence>
        {activeProfile && (
          <MatchDetailSheet
            profile={activeProfile}
            matchData={getMatchData(activeProfile.id)}
            showTagPicker={showTagPicker}
            editingNote={editingNote}
            noteText={noteText}
            customTag={customTag}
            onClose={() => setActiveProfile(null)}
            onToggleTagPicker={() => setShowTagPicker(!showTagPicker)}
            onToggleTag={(tag) => toggleTag(activeProfile.id, tag)}
            onSetCustomTag={setCustomTag}
            onAddCustomTag={() => addCustomTag(activeProfile.id)}
            onSetEditingNote={setEditingNote}
            onSetNoteText={setNoteText}
            onSaveNote={() => saveNote(activeProfile.id)}
            onViewResonance={() => {
              setActiveProfile(null);
              setTimeout(() => setViewingResonance(activeProfile), 200);
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

// ============================================================================
// Match Detail Sheet (extracted sub-component)
// ============================================================================
interface MatchDetailSheetProps {
  profile: ResonanceProfile;
  matchData: MatchData;
  showTagPicker: boolean;
  editingNote: boolean;
  noteText: string;
  customTag: string;
  onClose: () => void;
  onToggleTagPicker: () => void;
  onToggleTag: (tag: string) => void;
  onSetCustomTag: (v: string) => void;
  onAddCustomTag: () => void;
  onSetEditingNote: (v: boolean) => void;
  onSetNoteText: (v: string) => void;
  onSaveNote: () => void;
  onViewResonance: () => void;
}

const MatchDetailSheet = ({
  profile,
  matchData,
  showTagPicker,
  editingNote,
  noteText,
  customTag,
  onClose,
  onToggleTagPicker,
  onToggleTag,
  onSetCustomTag,
  onAddCustomTag,
  onSetEditingNote,
  onSetNoteText,
  onSaveNote,
  onViewResonance,
}: MatchDetailSheetProps) => (
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
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card p-5"
    >
      {/* Handle */}
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <img src={profile.image} alt={profile.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-foreground">
            {profile.name}, {profile.age}
          </h3>
          <p className="text-xs text-muted-foreground">{profile.handle} · {profile.distance}</p>
        </div>
        <button
          onClick={onViewResonance}
          className="rounded-full bg-primary/10 p-2 transition-colors hover:bg-primary/20"
          title="View full resonance profile"
        >
          <Eye className="h-4 w-4 text-primary" />
        </button>
        <button onClick={onClose} className="rounded-full bg-secondary p-2">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Quick resonance peek */}
      <div className="mb-4 rounded-2xl bg-secondary/30 p-3">
        <p className="text-xs font-semibold text-foreground mb-2">🪞 {profile.experiential.type.archetype}</p>
        <p className="text-xs text-muted-foreground italic">"{profile.experiential.lessons[0]}"</p>
      </div>

      {/* Tags section */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3.5 w-3.5" /> Tags
          </h4>
          <button
            onClick={onToggleTagPicker}
            className="rounded-full bg-secondary p-1.5 transition-colors hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {matchData.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className="flex items-center gap-1 rounded-full gradient-warm px-2.5 py-1 text-[11px] font-medium text-primary-foreground"
            >
              {tag}
              <X className="h-3 w-3" />
            </button>
          ))}
          {matchData.tags.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No tags yet</p>
          )}
        </div>

        <AnimatePresence>
          {showTagPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-secondary/50 p-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {defaultTags.map((tag) => {
                    const isActive = matchData.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => onToggleTag(tag)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                          isActive
                            ? "gradient-warm text-primary-foreground"
                            : "bg-card text-foreground border border-border"
                        }`}
                      >
                        {isActive && <Check className="h-3 w-3" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customTag}
                    onChange={(e) => onSetCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onAddCustomTag()}
                    placeholder="Custom tag..."
                    className="flex-1 rounded-xl bg-card border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button
                    onClick={onAddCustomTag}
                    className="rounded-xl gradient-warm px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notes section */}
      <div className="mb-5">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          <StickyNote className="h-3.5 w-3.5" /> Private Notes
        </h4>

        {editingNote ? (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => onSetNoteText(e.target.value)}
              placeholder="Add your private notes..."
              rows={3}
              className="w-full rounded-2xl bg-secondary/50 border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => onSetEditingNote(false)}
                className="rounded-xl bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                onClick={onSaveNote}
                className="rounded-xl gradient-warm px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              onSetNoteText(matchData.notes);
              onSetEditingNote(true);
            }}
            className="w-full rounded-2xl bg-secondary/30 border border-border p-3 text-left text-sm transition-colors hover:bg-secondary/50"
          >
            {matchData.notes ? (
              <p className="text-foreground whitespace-pre-wrap">{matchData.notes}</p>
            ) : (
              <p className="italic text-muted-foreground">Tap to add notes...</p>
            )}
          </button>
        )}
      </div>

      {/* Interests */}
      <div className="rounded-2xl bg-secondary/30 p-4">
        <p className="text-sm text-foreground/80 mb-2">{profile.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.interests.map((interest) => (
            <span key={interest} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
              {interest}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  </motion.div>
);

export default MatchesPage;
