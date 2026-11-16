import { useMemo, useState } from "react";
import { Bookmark, Check, ChevronRight, Compass, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AESTHETIC_CATEGORIES,
  CURATED_AESTHETICS,
  curatedAestheticBySlug,
  filterAesthetics,
  type AestheticCategory,
  type AestheticEntry,
} from "@/data/aesthetics";
import {
  useCommunityAesthetics,
  useGoalStyleBoard,
  useGoalStyleVisibility,
  useRemoveGoalStyle,
  useSaveGoalStyle,
  type GoalStyleVisibility,
} from "@/hooks/use-aesthetics";
import AestheticCard from "@/components/aesthetics/AestheticCard";
import AestheticDetailsSheet from "@/components/aesthetics/AestheticDetailsSheet";
import CommunityAestheticSheet from "@/components/aesthetics/CommunityAestheticSheet";
import BottomNav from "@/components/BottomNav";

const visibilityCopy: Record<GoalStyleVisibility, string> = {
  private: "Only you can see this list.",
  matches: "Only you and your matches can see this list.",
  public: "Anyone viewing your shared profile can see this list.",
};

const AestheticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTabState] = useState<"atlas" | "goal">(searchParams.get("tab") === "goal" ? "goal" : "atlas");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AestheticCategory | "all">("all");
  const [selected, setSelected] = useState<AestheticEntry | null>(null);
  const [communityOpen, setCommunityOpen] = useState(false);

  const community = useCommunityAesthetics();
  const boardQuery = useGoalStyleBoard();
  const board = boardQuery.data ?? { id: null, visibility: "private" as const, pins: [] };
  const save = useSaveGoalStyle();
  const remove = useRemoveGoalStyle();
  const setVisibility = useGoalStyleVisibility();

  const entries = useMemo(
    () => [...CURATED_AESTHETICS, ...(community.data ?? []).filter((entry) => !curatedAestheticBySlug.has(entry.slug))],
    [community.data],
  );
  const entriesBySlug = useMemo(() => new Map(entries.map((entry) => [entry.slug, entry])), [entries]);
  const savedSlugs = useMemo(() => new Set(board.pins.map((pin) => pin.aestheticSlug)), [board.pins]);
  const filtered = useMemo(() => filterAesthetics(entries, query, category), [entries, query, category]);
  const groups = useMemo(() => {
    const result = new Map<string, { category: AestheticCategory; family: string; entries: AestheticEntry[] }>();
    for (const entry of filtered) {
      const key = `${entry.category}:${entry.family}`;
      if (!result.has(key)) result.set(key, { category: entry.category, family: entry.family, entries: [] });
      result.get(key)!.entries.push(entry);
    }
    return [...result.values()];
  }, [filtered]);

  const setTab = (next: "atlas" | "goal") => {
    setTabState(next);
    setSearchParams(next === "goal" ? { tab: "goal" } : {});
  };

  const toggleSave = (entry: AestheticEntry) => {
    if (!user) {
      toast.info("Sign in to build your Goal Style list");
      navigate("/auth");
      return;
    }
    if (savedSlugs.has(entry.slug)) {
      if (!board.id) return;
      remove.mutate({ boardId: board.id, slug: entry.slug }, {
        onSuccess: () => toast.success(`Removed ${entry.name} from Goal Style`),
        onError: () => toast.error("Couldn't remove this style"),
      });
    } else {
      save.mutate({ slug: entry.slug }, {
        onSuccess: () => toast.success(`Saved ${entry.name} to Goal Style`),
        onError: () => toast.error("Couldn't save this style"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-28 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">A cross-linked field guide</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Aesthetic atlas</h1>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">Explore directions, mix what fits, and leave the rest. No images, no definitive taxonomy, no label police.</p>
        </div>
        {tab === "atlas" && (
          <button onClick={() => user ? setCommunityOpen(true) : navigate("/auth")} aria-label="Add a community aesthetic" className="shrink-0 rounded-xl gradient-warm p-2.5 text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-secondary p-1">
        <button onClick={() => setTab("atlas")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${tab === "atlas" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
          <Compass className="h-4 w-4" /> Atlas
        </button>
        <button onClick={() => setTab("goal")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${tab === "goal" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
          <Bookmark className="h-4 w-4" /> Goal Style {board.pins.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-foreground">{board.pins.length}</span>}
        </button>
      </div>

      {tab === "atlas" ? (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, materials, moods, sounds…" className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>All {entries.length}</button>
            {AESTHETIC_CATEGORIES.map((item) => (
              <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === item.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{item.shortLabel}</button>
            ))}
          </div>

          {community.isError && <p className="mb-4 rounded-xl bg-card p-3 text-xs text-muted-foreground">Community additions couldn’t load. The 48 curated styles are still available.</p>}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-display text-lg text-foreground">No matching branch</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a broader word, or add the missing style to the community atlas.</p>
            </div>
          )}
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={`${group.category}:${group.family}`}>
                <div className="mb-2.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <span>{AESTHETIC_CATEGORIES.find((item) => item.id === group.category)?.shortLabel}</span>
                  <ChevronRight className="h-3 w-3 text-primary" />
                  <span>{group.family}</span>
                  <span className="ml-auto tracking-normal">{group.entries.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  {group.entries.map((entry) => (
                    <AestheticCard key={entry.slug} entry={entry} saved={savedSlugs.has(entry.slug)} saving={save.isPending || remove.isPending} onOpen={() => setSelected(entry)} onToggleSave={() => toggleSave(entry)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {!user && (
            <section className="rounded-2xl border border-primary/20 bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Your list starts with an account</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Sign in to save styles, add your own notes, and choose who can see them.</p>
              <button onClick={() => navigate("/auth")} className="mt-3 rounded-xl gradient-warm px-4 py-2 text-xs font-semibold text-primary-foreground">Sign in to build Goal Style</button>
            </section>
          )}
          <section className="rounded-2xl border border-border bg-card p-4">
            <label htmlFor="goal-visibility" className="text-xs font-semibold text-foreground">Who can see your Goal Style?</label>
            <select id="goal-visibility" value={board.visibility} disabled={!user || setVisibility.isPending} onChange={(event) => setVisibility.mutate(event.target.value as GoalStyleVisibility, { onSuccess: () => toast.success("Visibility updated"), onError: () => toast.error("Couldn't update visibility") })} className="mt-2 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40">
              <option value="private">Private</option>
              <option value="matches">Matches only</option>
              <option value="public">Public on my profile</option>
            </select>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{visibilityCopy[board.visibility]}</p>
          </section>

          {boardQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading your list…</p>
          ) : board.pins.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <Bookmark className="mx-auto mb-3 h-6 w-6 text-primary" />
              <h2 className="font-display text-lg text-foreground">No fixed identity required</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Save contrasting directions, half-formed ideas, or one very specific obsession. Your notes give them your meaning.</p>
              <button onClick={() => setTab("atlas")} className="mt-4 rounded-xl gradient-warm px-4 py-2.5 text-xs font-semibold text-primary-foreground">Browse the atlas</button>
            </div>
          ) : (
            <div className="space-y-3">
              {board.pins.map((pin) => {
                const entry = entriesBySlug.get(pin.aestheticSlug);
                return (
                  <article key={pin.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <button className="min-w-0 flex-1 text-left" onClick={() => entry && setSelected(entry)}>
                        <p className="font-display text-base font-semibold text-foreground">{entry?.name ?? pin.aestheticSlug.replace(/-/g, " ")}</p>
                        {entry && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>}
                      </button>
                      <button aria-label={`Remove ${entry?.name ?? "style"} from Goal Style`} disabled={remove.isPending || !board.id} onClick={() => board.id && remove.mutate({ boardId: board.id, slug: pin.aestheticSlug }, { onSuccess: () => toast.success("Style removed"), onError: () => toast.error("Couldn't remove this style") })} className="rounded-xl bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea key={`${pin.id}:${pin.note}`} defaultValue={pin.note} onBlur={(event) => { const note = event.target.value.trim(); if (note !== pin.note) save.mutate({ slug: pin.aestheticSlug, note }, { onError: () => toast.error("Couldn't save your note") }); }} placeholder="What does this mean for your goal style?" maxLength={500} className="mt-3 min-h-20 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40" />
                    {save.isSuccess && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AestheticDetailsSheet entry={selected} entriesBySlug={entriesBySlug} saved={selected ? savedSlugs.has(selected.slug) : false} saving={save.isPending || remove.isPending} onOpenChange={(open) => !open && setSelected(null)} onToggleSave={() => selected && toggleSave(selected)} onSelectRelated={setSelected} />
      <CommunityAestheticSheet open={communityOpen} onOpenChange={setCommunityOpen} onAdded={setSelected} />
      {user && <BottomNav />}
    </div>
  );
};

export default AestheticsPage;
