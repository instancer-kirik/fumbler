import { useState } from "react";
import { profiles, type Profile } from "@/data/profiles";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag, StickyNote, Check } from "lucide-react";

interface MatchData {
  tags: string[];
  notes: string;
}

const defaultTags = ["Met IRL", "Great Convo", "Funny", "Vibes ✨", "Follow Up", "Coffee Date"];

const MatchesPage = () => {
  const [matchData, setMatchData] = useState<Record<string, MatchData>>({});
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [customTag, setCustomTag] = useState("");

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

  const openProfile = (profile: Profile) => {
    setActiveProfile(profile);
    setNoteText(getMatchData(profile.id).notes);
    setShowTagPicker(false);
    setEditingNote(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
        Matches
      </h1>

      {/* New Matches row */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          New Matches
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {profiles.slice(0, 3).map((profile, i) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => openProfile(profile)}
              className="flex-shrink-0"
            >
              <div className="relative h-24 w-20 overflow-hidden rounded-2xl gradient-warm p-[2px]">
                <img src={profile.image} alt={profile.name} className="h-full w-full rounded-2xl object-cover" />
              </div>
              <p className="mt-1.5 text-center text-xs font-semibold text-foreground">{profile.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Messages</h2>
      <div className="space-y-3">
        {profiles.map((profile, i) => {
          const data = getMatchData(profile.id);
          return (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => openProfile(profile)}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 shadow-card text-left"
            >
              <img src={profile.image} alt={profile.name} className="h-14 w-14 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-foreground">{profile.name}</p>
                {data.tags.length > 0 ? (
                  <div className="flex gap-1 mt-0.5 overflow-hidden">
                    {data.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-foreground truncate">
                        {tag}
                      </span>
                    ))}
                    {data.tags.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{data.tags.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sent you a message 💬</p>
                )}
              </div>
              {data.notes && <StickyNote className="h-4 w-4 text-primary/50 flex-shrink-0" />}
              <div className="h-2.5 w-2.5 rounded-full gradient-warm flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Profile detail sheet */}
      <AnimatePresence>
        {activeProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setActiveProfile(null)}
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
                <img src={activeProfile.image} alt={activeProfile.name} className="h-16 w-16 rounded-full object-cover" />
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {activeProfile.name}, {activeProfile.age}
                  </h3>
                  <p className="text-sm text-muted-foreground">{activeProfile.distance}</p>
                </div>
                <button onClick={() => setActiveProfile(null)} className="ml-auto rounded-full bg-secondary p-2">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Tags section */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Tag className="h-4 w-4" /> Tags
                  </h4>
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="rounded-full bg-secondary p-1.5 transition-colors hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Active tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {getMatchData(activeProfile.id).tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(activeProfile.id, tag)}
                      className="flex items-center gap-1 rounded-full gradient-warm px-3 py-1 text-xs font-medium text-primary-foreground"
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  {getMatchData(activeProfile.id).tags.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No tags yet — add some!</p>
                  )}
                </div>

                {/* Tag picker */}
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
                            const isActive = getMatchData(activeProfile.id).tags.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleTag(activeProfile.id, tag)}
                                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                  isActive
                                    ? "gradient-warm text-primary-foreground"
                                    : "bg-card text-foreground shadow-sm"
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
                            onChange={(e) => setCustomTag(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCustomTag(activeProfile.id)}
                            placeholder="Custom tag..."
                            className="flex-1 rounded-xl bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                          />
                          <button
                            onClick={() => addCustomTag(activeProfile.id)}
                            className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
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
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                  <StickyNote className="h-4 w-4" /> Private Notes
                </h4>

                {editingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add your private notes about this person..."
                      rows={3}
                      className="w-full rounded-2xl bg-secondary/50 p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingNote(false)}
                        className="rounded-xl bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNote(activeProfile.id)}
                        className="rounded-xl gradient-warm px-4 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNoteText(getMatchData(activeProfile.id).notes);
                      setEditingNote(true);
                    }}
                    className="w-full rounded-2xl bg-secondary/50 p-3 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    {getMatchData(activeProfile.id).notes ? (
                      <p className="text-foreground whitespace-pre-wrap">{getMatchData(activeProfile.id).notes}</p>
                    ) : (
                      <p className="italic text-muted-foreground">Tap to add notes...</p>
                    )}
                  </button>
                )}
              </div>

              {/* Bio */}
              <div className="rounded-2xl bg-secondary/30 p-4">
                <p className="text-sm text-foreground/80 mb-2">{activeProfile.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.interests.map((interest) => (
                    <span key={interest} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchesPage;
