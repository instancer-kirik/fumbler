import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sliders, Menu, Pin, Search, X, UsersRound, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import SwipeActions from "./SwipeActions";
import MissedConnectionsDrawer from "./MissedConnectionsDrawer";
import HamburgerMenu from "./HamburgerMenu";
import DiscoverFiltersSheet from "./DiscoverFiltersSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ResonanceProfile } from "@/data/resonance-profile";
import { countActiveExtras, loadExtraFilters } from "@/lib/discover-filters";
import {
  filtersForMode,
  getCandidateIntentFilter,
  loadConnectionMode,
  saveConnectionMode,
  type ConnectionMode,
} from "@/lib/connection-mode";


// Map "Interested in" preferences → gender values on candidate profiles
const INTEREST_TO_GENDER: Record<string, string[]> = {
  Women: ["Woman", "F"],
  Men: ["Man", "M"],
  "Non-binary": ["Non-binary", "Trans", "Other"],
};

const SEARCH_KEY = "fumbler.discover.search";

type DiscoverCardProfile = ResonanceProfile & {
  username?: string;
  lookingFor: string[];
  profileTypes: string[];
};

// Build a minimal ResonanceProfile from DB row for the card stack
const dbToCardProfile = (row: any): DiscoverCardProfile => ({
  id: row.id,
  name: row.full_name || "Anonymous",
  handle: `@${row.username || "unknown"}`,
  username: row.username,
  lookingFor: row.looking_for || [],
  profileTypes: row.profile_types || [],
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
  const [profiles, setProfiles] = useState<DiscoverCardProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(loadConnectionMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinSelf, setPinSelf] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PIN_SELF_KEY) === "1";
  });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [extraCount, setExtraCount] = useState(() =>
    countActiveExtras(filtersForMode(loadExtraFilters(), loadConnectionMode())),
  );

  const [filterVersion, setFilterVersion] = useState(0);
  const [search, setSearch] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(SEARCH_KEY) || "";
  });
  const [searchDebounced, setSearchDebounced] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      if (typeof window !== "undefined") localStorage.setItem(SEARCH_KEY, search);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

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

      const extras = filtersForMode(loadExtraFilters(), connectionMode);

      let query: any = supabase
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url, bio, age, gender, looking_for, orientation, profile_types, is_public, resonance_data",
        )
        .eq("onboarding_complete", true);

      if (extras.orientations.length > 0)
        query = query.in("orientation", extras.orientations);
      if (extras.profileTypes.length > 0)
        query = query.overlaps("profile_types", extras.profileTypes);
      if (extras.hasPhoto) query = query.not("avatar_url", "is", null);
      if (extras.publicOnly) query = query.eq("is_public", true);


      if (!pinSelf) query = query.neq("id", user.id);

      // Age range — allow null ages through
      if (me.age_min != null)
        query = query.or(`age.is.null,age.gte.${me.age_min}`);
      if (me.age_max != null)
        query = query.or(`age.is.null,age.lte.${me.age_max}`);

      // Interested in → gender array overlap, null/empty allowed through
      const interested = me.interested_in || [];
      if (connectionMode === "all" && interested.length > 0 && !interested.includes("Everyone")) {
        const genders = interested.flatMap((i) => INTEREST_TO_GENDER[i] || []);
        if (genders.length > 0) {
          const arr = `{${genders.join(",")}}`;
          query = query.or(`gender.eq.{},gender.ov.${arr}`);
        }
      }

      // Looking for overlap — null/empty allowed through
      const wants = connectionMode === "all" ? me.looking_for || [] : [];
      if (wants.length > 0) {
        const arr = `{${wants.join(",")}}`;
        query = query.or(`looking_for.eq.{},looking_for.ov.${arr}`);
      }

      // Platonic is an explicit opt-in filter; All leaves the existing pool intact.
      const candidateIntentFilter = getCandidateIntentFilter(connectionMode);
      if (candidateIntentFilter) query = query.or(candidateIntentFilter);

      // Keyword search across name/username/bio
      const q = searchDebounced.trim();
      if (q.length > 0) {
        const like = `%${q.replace(/[%,]/g, "")}%`;
        query = query.or(
          `full_name.ilike.${like},username.ilike.${like},bio.ilike.${like}`,
        );
      }

      const { data, error } = await query;

      if (!error && data) {
        const rows = extras.hasResonance
          ? (data as any[]).filter(
              (r) => r.resonance_data && Object.keys(r.resonance_data).length > 0,
            )
          : (data as any[]);
        const mapped = rows.map(dbToCardProfile);

        if (pinSelf) {
          mapped.sort((a: any, b: any) => (a.id === user.id ? -1 : b.id === user.id ? 1 : 0));
        }
        setProfiles(mapped);
        setCurrentIndex(0);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [user, pinSelf, filterVersion, searchDebounced, connectionMode]);

  const changeConnectionMode = (mode: ConnectionMode) => {
    saveConnectionMode(mode);
    setConnectionMode(mode);
    setExtraCount(countActiveExtras(filtersForMode(loadExtraFilters(), mode)));
  };

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
            aria-label="Open menu"
            className="rounded-full bg-secondary p-2.5 transition-colors hover:bg-secondary/80"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label="Discovery filters"
            className="relative rounded-full bg-secondary p-2.5 transition-colors hover:bg-secondary/80"
          >
            <Sliders className="h-5 w-5 text-foreground" />
            {extraCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {extraCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Connection mode */}
      <div className="flex items-center gap-2 px-5 pb-2">
        <div className="grid flex-1 grid-cols-2 rounded-2xl bg-secondary p-1">
          {(["all", "platonic"] as ConnectionMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => changeConnectionMode(mode)}
              aria-pressed={connectionMode === mode}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                connectionMode === mode ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {mode === "platonic" && <UsersRound className="h-3.5 w-3.5" />}
              {mode === "all" ? "All" : "Platonic"}
            </button>
          ))}
        </div>
        {connectionMode === "platonic" && (
          <Link to="/meetups" aria-label="Browse platonic meetups" className="gradient-warm rounded-2xl p-3 text-primary-foreground">
            <CalendarDays className="h-4 w-4" />
          </Link>
        )}
      </div>
      {connectionMode === "platonic" && (
        <div className="px-5 pb-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            People who chose Platonic or Friends. Gender, orientation, and romantic-intent filters are ignored. <Link to="/meetups" className="font-medium text-foreground underline underline-offset-2">Browse meetups</Link>
          </p>
        </div>
      )}

      {/* Search */}
      <div className="px-5 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, bio, keywords…"
            className="w-full rounded-full bg-secondary py-2 pl-9 pr-9 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative mx-auto w-full max-w-sm flex-1 px-4">
        <div className="relative h-[50vh] min-h-[320px] max-h-[620px] w-full">
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
                  ? connectionMode === "platonic" ? "No platonic profiles yet" : "No one here yet!"
                  : "No more profiles!"}
              </h2>
              <p className="text-center text-sm text-muted-foreground px-8">
                {profiles.length === 0
                  ? connectionMode === "platonic" ? "Try All, adjust your filters, or start a meetup." : "Be patient — more people are joining."
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
                    connectionMode={connectionMode}
                  />
                ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Actions */}
      {!allSwiped && !loading && profiles.length > 0 && (
        <div className="py-4">
          <SwipeActions onSwipe={handleSwipe} onSuperLike={handleSuperLike} connectionMode={connectionMode} />
        </div>
      )}

      {/* Missed Connections Drawer */}
      <HamburgerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onMissedConnections={() => setDrawerOpen(true)}
      />
      <MissedConnectionsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <DiscoverFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        mode={connectionMode}
        onSaved={() => {
          setExtraCount(countActiveExtras(filtersForMode(loadExtraFilters(), connectionMode)));
          setFilterVersion((v) => v + 1);
        }}

      />
    </div>
  );
};

export default DiscoverPage;
