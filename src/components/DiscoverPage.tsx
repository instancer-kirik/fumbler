import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sliders, Menu, Pin } from "lucide-react";
import ProfileCard from "./ProfileCard";
import SwipeActions from "./SwipeActions";
import MissedConnectionsDrawer from "./MissedConnectionsDrawer";
import HamburgerMenu from "./HamburgerMenu";
import DiscoverFiltersSheet from "./DiscoverFiltersSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ResonanceProfile } from "@/data/resonance-profile";

// Map "Interested in" preferences → gender values on candidate profiles
const INTEREST_TO_GENDER: Record<string, string[]> = {
  Women: ["Woman"],
  Men: ["Man"],
  "Non-binary": ["Non-binary", "Trans", "Other"],
};

// Build a minimal ResonanceProfile from DB row for the card stack
const dbToCardProfile = (row: any): ResonanceProfile & { username?: string } => ({
  id: row.id,
  name: row.full_name || "Anonymous",
  handle: `@${row.username || "unknown"}`,
  username: row.username,
  description: row.bio || "",
  image: row.avatar_url || "/placeholder.svg",
  age: row.age || 0,
  distance: "Nearby",
  bio: row.bio || "",
  interests: [],
  prompt: "My biggest fumble was...",
  promptAnswer: "Still figuring that out 🫠",
  core: {} as any,
  viability: {} as any,
  experiential: {} as any,
  economic: {} as any,
  seeking: {} as any,
  safety: {} as any,
  connection: {} as any,
});

const PIN_SELF_KEY = "fumbler.dev.pinSelf";

const DiscoverPage = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ResonanceProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinSelf, setPinSelf] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PIN_SELF_KEY) === "1";
  });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterVersion, setFilterVersion] = useState(0);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      setLoading(true);

      // Load my own filter preferences
      const { data: meRow } = await supabase
        .from("profiles")
        .select("interested_in, looking_for, age_min, age_max")
        .eq("id", user.id)
        .maybeSingle();
      const me = (meRow || {}) as {
        interested_in?: string[] | null;
        looking_for?: string[] | null;
        age_min?: number | null;
        age_max?: number | null;
      };

      let query = supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, age, gender, looking_for")
        .eq("onboarding_complete", true);

      if (!pinSelf) query = query.neq("id", user.id);

      if (me.age_min != null) query = query.gte("age", me.age_min);
      if (me.age_max != null) query = query.lte("age", me.age_max);

      const interested = me.interested_in || [];
      if (interested.length > 0 && !interested.includes("Everyone")) {
        const genders = interested.flatMap((i) => INTEREST_TO_GENDER[i] || []);
        if (genders.length > 0) query = query.in("gender", genders);
      }

      const wants = me.looking_for || [];
      if (wants.length > 0) query = query.overlaps("looking_for", wants);

      const { data, error } = await query;

      if (!error && data) {
        const mapped = data.map(dbToCardProfile);
        if (pinSelf) {
          mapped.sort((a, b) => (a.id === user.id ? -1 : b.id === user.id ? 1 : 0));
        }
        setProfiles(mapped);
        setCurrentIndex(0);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [user, pinSelf, filterVersion]);

  const togglePinSelf = () => {
    setPinSelf((prev) => {
      const next = !prev;
      localStorage.setItem(PIN_SELF_KEY, next ? "1" : "0");
      return next;
    });
  };

  const recordSwipe = useCallback(
    async (
      swipedProfile: ResonanceProfile,
      direction: "left" | "right" | "super",
    ) => {
      if (!user) return;
      // Record swipe
      await supabase.from("swipes").upsert(
        {
          swiper_id: user.id,
          swiped_id: swipedProfile.id,
          direction,
        },
        { onConflict: "swiper_id,swiped_id" },
      );

      // Check for mutual match on right/super swipes
      if (direction === "right" || direction === "super") {
        const { data: mutual } = await supabase
          .from("swipes")
          .select("id")
          .eq("swiper_id", swipedProfile.id)
          .eq("swiped_id", user.id)
          .in("direction", ["right", "super"])
          .maybeSingle();

        if (mutual) {
          // Create match (order IDs consistently)
          const [u1, u2] = [user.id, swipedProfile.id].sort();
          await supabase.from("matches").upsert(
            {
              user1_id: u1,
              user2_id: u2,
            },
            { onConflict: "user1_id,user2_id" },
          );
        }
      }
    },
    [user],
  );

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const profile = profiles[currentIndex];
      if (profile) recordSwipe(profile, direction);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, profiles, recordSwipe],
  );

  const handleSuperLike = useCallback(() => {
    const profile = profiles[currentIndex];
    if (profile) recordSwipe(profile, "super");
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, profiles, recordSwipe]);

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);
  const allSwiped = currentIndex >= profiles.length;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 gap-2">
        <h1 className="font-display text-3xl font-bold text-primary shrink-0">
          Fumbler
        </h1>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={togglePinSelf}
            title={pinSelf ? "Unpin my profile (dev)" : "Pin my profile (dev)"}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              pinSelf
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
            {pinSelf ? "Pinned" : "Pin me"}
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-full bg-secondary p-2.5 transition-colors hover:bg-secondary/80"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => setFiltersOpen(true)}
            className="rounded-full bg-secondary p-2.5 transition-colors hover:bg-secondary/80"
          >
            <Sliders className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Card stack */}
      <div className="relative mx-auto w-full max-w-sm flex-1 px-4">
        <div className="relative h-[65vh] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : allSwiped || profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col items-center justify-center rounded-3xl bg-card shadow-card"
            >
              <span className="mb-4 text-6xl">🫠</span>
              <h2 className="mb-2 font-display text-xl font-bold text-foreground">
                {profiles.length === 0
                  ? "No one here yet!"
                  : "No more profiles!"}
              </h2>
              <p className="text-center text-sm text-muted-foreground px-8">
                {profiles.length === 0
                  ? "Be patient — more people are joining."
                  : "You've seen everyone nearby. Check back later for new fumbles."}
              </p>
              {profiles.length > 0 && (
                <button
                  onClick={() => setCurrentIndex(0)}
                  className="mt-6 gradient-warm rounded-full px-6 py-3 font-semibold text-primary-foreground shadow-elevated"
                >
                  Start Over
                </button>
              )}
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
      {!allSwiped && !loading && profiles.length > 0 && (
        <div className="py-4">
          <SwipeActions onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
        </div>
      )}

      {/* Missed Connections Drawer */}
      <HamburgerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onMissedConnections={() => setDrawerOpen(true)}
      />
      <MissedConnectionsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default DiscoverPage;
