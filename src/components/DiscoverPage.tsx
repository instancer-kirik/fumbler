import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Sliders } from "lucide-react";
import ProfileCard from "./ProfileCard";
import SwipeActions from "./SwipeActions";
import { profiles } from "@/data/profiles";
import { motion } from "framer-motion";

const DiscoverPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      setCurrentIndex((prev) => prev + 1);
    },
    []
  );

  const handleSuperLike = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);
  const allSwiped = currentIndex >= profiles.length;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="gradient-warm bg-clip-text font-display text-3xl font-bold text-transparent">
          fumble
        </h1>
        <button className="rounded-full bg-secondary p-2.5">
          <Sliders className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Card stack */}
      <div className="relative mx-auto w-full max-w-sm flex-1 px-4">
        <div className="relative h-[65vh] w-full">
          {allSwiped ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col items-center justify-center rounded-3xl bg-card shadow-card"
            >
              <span className="mb-4 text-6xl">🫠</span>
              <h2 className="mb-2 font-display text-xl font-bold text-foreground">
                No more profiles!
              </h2>
              <p className="text-center text-sm text-muted-foreground px-8">
                You've seen everyone nearby. Check back later for new fumbles.
              </p>
              <button
                onClick={() => setCurrentIndex(0)}
                className="mt-6 gradient-warm rounded-full px-6 py-3 font-semibold text-primary-foreground shadow-elevated"
              >
                Start Over
              </button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {visibleProfiles
                .slice()
                .reverse()
                .map((profile, i) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onSwipe={handleSwipe}
                    isTop={i === visibleProfiles.length - 1}
                  />
                ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Actions */}
      {!allSwiped && (
        <div className="py-4">
          <SwipeActions onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
