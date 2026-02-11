import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CalendarHeart, Sparkles } from "lucide-react";
import type { ResonanceProfile } from "@/data/resonance-profile";

interface Nudge {
  profile: ResonanceProfile;
  daysSince: number;
  message: string;
}

interface MatchNudgesProps {
  nudges: Nudge[];
  onDismiss: (profileId: string) => void;
  onSchedule: (profile: ResonanceProfile) => void;
  onOpen: (profile: ResonanceProfile) => void;
}

const MatchNudges = ({ nudges, onDismiss, onSchedule, onOpen }: MatchNudgesProps) => {
  if (nudges.length === 0) return null;

  return (
    <div className="px-4 mb-4 space-y-2">
      <AnimatePresence>
        {nudges.slice(0, 2).map((nudge) => (
          <motion.div
            key={nudge.profile.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-3"
          >
            <button onClick={() => onOpen(nudge.profile)} className="flex-shrink-0">
              <div className="relative">
                <img
                  src={nudge.profile.image}
                  alt={nudge.profile.name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30"
                />
                {nudge.daysSince >= 7 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                    <Clock className="h-2.5 w-2.5 text-destructive-foreground" />
                  </div>
                )}
              </div>
            </button>
            
            <button onClick={() => onOpen(nudge.profile)} className="flex-1 min-w-0 text-left">
              <p className="text-xs text-foreground leading-relaxed">{nudge.message}</p>
            </button>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onSchedule(nudge.profile)}
                className="rounded-full bg-primary/10 p-1.5 hover:bg-primary/20 transition-colors"
                title="Schedule a fumble"
              >
                <CalendarHeart className="h-3.5 w-3.5 text-primary" />
              </button>
              <button
                onClick={() => onDismiss(nudge.profile.id)}
                className="rounded-full bg-secondary p-1.5 hover:bg-secondary/80 transition-colors"
                title="Dismiss"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MatchNudges;
