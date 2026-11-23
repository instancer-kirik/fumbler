import { X, Heart, Star, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import type { ConnectionMode } from "@/lib/connection-mode";

interface SwipeActionsProps {
  onSwipe: (direction: "left" | "right") => void;
  onSuperLike: () => void;
  connectionMode: ConnectionMode;
}

const SwipeActions = ({ onSwipe, onSuperLike, connectionMode }: SwipeActionsProps) => {
  const platonic = connectionMode === "platonic";
  return (
    <div className="flex items-center justify-center gap-5">
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => onSwipe("left")}
        aria-label="Pass"
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-card shadow-card transition-colors hover:bg-destructive/10"
      >
        <X className="h-7 w-7 text-destructive" />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onSuperLike}
        aria-label={platonic ? "Especially interested in connecting" : "Super like"}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-400/30 bg-card shadow-card transition-colors hover:bg-blue-400/10"
      >
        <Star className="h-6 w-6 text-blue-400" />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => onSwipe("right")}
        aria-label={platonic ? "Connect platonically" : "Like"}
        className="gradient-warm flex h-16 w-16 items-center justify-center rounded-full shadow-elevated"
      >
        {platonic ? <UserPlus className="h-7 w-7 text-primary-foreground" /> : <Heart className="h-7 w-7 text-primary-foreground" />}
      </motion.button>
    </div>
  );
};

export default SwipeActions;
