import { X, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";

interface SwipeActionsProps {
  onSwipe: (direction: "left" | "right") => void;
  onSuperLike: () => void;
}

const SwipeActions = ({ onSwipe, onSuperLike }: SwipeActionsProps) => {
  return (
    <div className="flex items-center justify-center gap-5">
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => onSwipe("left")}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-card shadow-card transition-colors hover:bg-destructive/10"
      >
        <X className="h-7 w-7 text-destructive" />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onSuperLike}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-400/30 bg-card shadow-card transition-colors hover:bg-blue-400/10"
      >
        <Star className="h-6 w-6 text-blue-400" />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => onSwipe("right")}
        className="gradient-warm flex h-16 w-16 items-center justify-center rounded-full shadow-elevated"
      >
        <Heart className="h-7 w-7 text-primary-foreground" />
      </motion.button>
    </div>
  );
};

export default SwipeActions;
