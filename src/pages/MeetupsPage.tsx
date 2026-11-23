import { useMemo, useState } from "react";
import { CalendarPlus, Compass, Search, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMeetups, type Meetup } from "@/hooks/use-meetups";
import MeetupComposerSheet, { MEETUP_CATEGORIES } from "@/components/meetups/MeetupComposerSheet";
import MeetupCard from "@/components/meetups/MeetupCard";

type MeetupView = "upcoming" | "hosting";

const MeetupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meetups = useMeetups();
  const [view, setView] = useState<MeetupView>("upcoming");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Meetup | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (meetups.data || []).filter((meetup) => {
      if (view === "hosting" && meetup.host_id !== user?.id) return false;
      if (view === "upcoming" && meetup.status !== "published") return false;
      if (view === "upcoming" && new Date(meetup.ends_at || meetup.starts_at).getTime() < Date.now() - 2 * 60 * 60 * 1000) return false;
      if (category !== "All" && meetup.category !== category) return false;
      if (!needle) return true;
      return [meetup.title, meetup.description, meetup.location_name, meetup.host_name || ""]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [meetups.data, query, category, view, user?.id]);

  const openComposer = (meetup: Meetup | null = null) => {
    setEditing(meetup);
    setComposerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-28 pt-6">
      <header className="mb-5 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-foreground">Meetups</h1>
            </div>
            <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">Platonic plans around things you actually want to do. No romantic expectation attached.</p>
          </div>
          <button onClick={() => openComposer()} className="gradient-warm flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-primary-foreground">
            <CalendarPlus className="h-4 w-4" />Host
          </button>
        </div>
      </header>

      <div className="px-4">
        <div className="mb-3 grid grid-cols-2 rounded-2xl bg-secondary p-1">
          {(["upcoming", "hosting"] as MeetupView[]).map((item) => (
            <button key={item} onClick={() => setView(item)} className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-colors ${view === item ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
              {item === "upcoming" ? "Upcoming" : "My plans"}
            </button>
          ))}
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activities, places, or hosts…" className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {["All", ...MEETUP_CATEGORIES].map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === item ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <main className="space-y-3 px-4">
        {meetups.isLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : meetups.error ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center">
            <p className="mb-2 font-display font-semibold text-foreground">Meetups couldn’t load</p>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{meetups.error instanceof Error ? meetups.error.message : "Try again in a moment."}</p>
            <button onClick={() => meetups.refetch()} className="rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground">Try again</button>
          </div>
        ) : filtered.length ? (
          filtered.map((meetup) => <MeetupCard key={meetup.id} meetup={meetup} isHost={meetup.host_id === user?.id} onEdit={openComposer} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <UsersRound className="mx-auto mb-3 h-9 w-9 text-primary" />
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{view === "hosting" ? "No plans hosted yet" : "No matching meetups"}</h2>
            <p className="mx-auto mb-5 max-w-xs text-xs leading-relaxed text-muted-foreground">{view === "hosting" ? "Start with something small and specific: a walk, a jam, a repair table, or coffee around a shared interest." : "Try another search, or be the person who starts the plan you want to find."}</p>
            <button onClick={() => openComposer()} className="gradient-warm rounded-xl px-5 py-2.5 text-xs font-semibold text-primary-foreground">Host a meetup</button>
          </div>
        )}
      </main>

      <button onClick={() => navigate("/discover")} className="mx-auto mt-6 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        <Compass className="h-3.5 w-3.5" />Back to people discovery
      </button>

      <MeetupComposerSheet open={composerOpen} onOpenChange={setComposerOpen} meetup={editing} />
    </div>
  );
};

export default MeetupsPage;
