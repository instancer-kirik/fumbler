import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import type { ResonanceProfile } from "@/data/resonance-profile";

interface ProfileCardProps {
  profile: ResonanceProfile & { username?: string };
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

const ProfileCard = ({ profile, onSwipe, isTop }: ProfileCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-elevated">
        {/* Image */}
        <img
          src={profile.image}
          alt={profile.name}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute left-6 top-8 z-20 rounded-xl border-4 border-primary px-4 py-2 font-display text-2xl font-bold text-primary"
              style={{ opacity: likeOpacity, rotate: -12 }}
            >
              LIKE 💛
            </motion.div>
            <motion.div
              className="absolute right-6 top-8 z-20 rounded-xl border-4 border-destructive px-4 py-2 font-display text-2xl font-bold text-destructive"
              style={{ opacity: nopeOpacity, rotate: 12 }}
            >
              NOPE 👋
            </motion.div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
          <div className="mb-1 flex items-end gap-3">
            <h2 className="font-display text-3xl font-bold">
              {profile.name}, {profile.age}
            </h2>
          </div>

          <div className="mb-3 flex items-center gap-1.5 text-sm opacity-80">
            <MapPin className="h-3.5 w-3.5" />
            <span>{profile.distance}</span>
          </div>

          <p className="mb-4 text-sm leading-relaxed opacity-90">{profile.bio}</p>

          {/* Prompt card */}
          <div className="rounded-2xl bg-primary-foreground/15 p-4 backdrop-blur-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">
              {profile.prompt}
            </p>
            <p className="text-sm font-medium leading-relaxed">
              {profile.promptAnswer}
            </p>
          </div>

          {/* Interest tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium backdrop-blur-sm"
              >
                {interest}
              </span>
            ))}
          </div>

          {/* View full profile */}
          {profile.username && (
            <Link
              to={`/u/${profile.username}`}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-primary-foreground/15 py-2.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm transition-colors hover:bg-primary-foreground/25"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              View full profile
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
