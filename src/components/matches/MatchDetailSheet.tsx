import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag, StickyNote, Check, Eye, CalendarHeart } from "lucide-react";
import type { ResonanceProfile } from "@/data/resonance-profile";
import type { MatchData } from "@/utils/match-helpers";
import { defaultTags, getTimeSinceLabel, getSimulatedLastInteraction } from "@/utils/match-helpers";
import ScheduleFumble from "./ScheduleFumble";

interface MatchDetailSheetProps {
  profile: ResonanceProfile;
  matchData: MatchData;
  onClose: () => void;
  onToggleTag: (tag: string) => void;
  onSaveNote: (note: string) => void;
  onViewResonance: () => void;
}

const MatchDetailSheet = ({
  profile,
  matchData,
  onClose,
  onToggleTag,
  onSaveNote,
  onViewResonance,
}: MatchDetailSheetProps) => {
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(matchData.notes);
  const [customTag, setCustomTag] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  const addCustomTag = () => {
    if (!customTag.trim()) return;
    onToggleTag(customTag.trim());
    setCustomTag("");
  };

  const lastInteraction = getSimulatedLastInteraction(profile.id);
  const timeSince = getTimeSinceLabel(lastInteraction);

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
            <p className="text-xs text-muted-foreground">
              {profile.handle} · {profile.distance} · Active {timeSince}
            </p>
          </div>
          <button onClick={onViewResonance} className="rounded-full bg-primary/10 p-2 hover:bg-primary/20 transition-colors" title="View resonance">
            <Eye className="h-4 w-4 text-primary" />
          </button>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className={`rounded-full p-2 transition-colors ${showSchedule ? "bg-primary/20" : "bg-primary/10 hover:bg-primary/20"}`}
            title="Schedule a fumble"
          >
            <CalendarHeart className="h-4 w-4 text-primary" />
          </button>
          <button onClick={onClose} className="rounded-full bg-secondary p-2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Schedule a Fumble */}
        <AnimatePresence>
          {showSchedule && (
            <div className="mb-4">
              <ScheduleFumble profile={profile} onClose={() => setShowSchedule(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Quick resonance peek */}
        {profile.experiential?.type?.archetype && (
          <div className="mb-4 rounded-2xl bg-secondary/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">🪞 {profile.experiential.type.archetype}</p>
            {profile.experiential.lessons?.[0] && (
              <p className="text-xs text-muted-foreground italic">"{profile.experiential.lessons[0]}"</p>
            )}
          </div>
        )}

        {/* Tags section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5" /> Tags
            </h4>
            <button onClick={() => setShowTagPicker(!showTagPicker)} className="rounded-full bg-secondary p-1.5 hover:bg-primary/10 transition-colors">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {matchData.tags.map((tag) => (
              <button key={tag} onClick={() => onToggleTag(tag)} className="flex items-center gap-1 rounded-full gradient-warm px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                {tag} <X className="h-3 w-3" />
              </button>
            ))}
            {matchData.tags.length === 0 && <p className="text-xs text-muted-foreground italic">No tags yet</p>}
          </div>

          <AnimatePresence>
            {showTagPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="rounded-2xl bg-secondary/50 p-3">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {defaultTags.map((tag) => {
                      const isActive = matchData.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => onToggleTag(tag)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            isActive ? "gradient-warm text-primary-foreground" : "bg-card text-foreground border border-border"
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
                      onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                      placeholder="Custom tag..."
                      className="flex-1 rounded-xl bg-card border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <button onClick={addCustomTag} className="rounded-xl gradient-warm px-3 py-2 text-xs font-semibold text-primary-foreground">
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
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add your private notes..."
                rows={3}
                className="w-full rounded-2xl bg-secondary/50 border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingNote(false)} className="rounded-xl bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground">Cancel</button>
                <button onClick={() => { onSaveNote(noteText); setEditingNote(false); }} className="rounded-xl gradient-warm px-4 py-2 text-xs font-semibold text-primary-foreground">Save</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setNoteText(matchData.notes); setEditingNote(true); }}
              className="w-full rounded-2xl bg-secondary/30 border border-border p-3 text-left text-sm hover:bg-secondary/50 transition-colors"
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
};

export default MatchDetailSheet;
