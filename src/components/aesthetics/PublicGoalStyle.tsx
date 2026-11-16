import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AESTHETIC_CATEGORIES, CURATED_AESTHETICS, type AestheticEntry } from "@/data/aesthetics";

const curatedBySlug = new Map(CURATED_AESTHETICS.map((entry) => [entry.slug, entry]));

const PublicGoalStyle = ({ targetId }: { targetId: string }) => {
  const { data } = useQuery({
    queryKey: ["public-goal-style", targetId],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data: board, error } = await (supabase.rpc as any)("get_goal_style_board", { target_id: targetId });
      if (error) throw error;
      const pins = (board?.pins ?? []) as { aestheticSlug: string; note: string }[];
      if (!pins.length) return [];
      const missing = pins.map((pin) => pin.aestheticSlug).filter((slug) => !curatedBySlug.has(slug));
      let community: any[] = [];
      if (missing.length) {
        const { data: rows } = await (supabase as any)
          .from("aesthetic_entries")
          .select("slug, name, category, summary, description, tags, related_slugs")
          .in("slug", missing);
        community = rows ?? [];
      }
      const communityBySlug = new Map(community.map((entry) => [entry.slug, entry]));
      return pins.map((pin) => {
        const curated = curatedBySlug.get(pin.aestheticSlug);
        const raw = communityBySlug.get(pin.aestheticSlug);
        const entry: AestheticEntry | undefined = curated ?? (raw ? {
          slug: raw.slug, name: raw.name, category: raw.category, family: "Community", summary: raw.summary,
          description: raw.description ?? "", tags: raw.tags ?? [], related: raw.related_slugs ?? [], source: "community",
        } : undefined);
        return entry ? { pin, entry } : null;
      }).filter(Boolean) as { pin: { note: string }; entry: AestheticEntry }[];
    },
  });

  if (!data?.length) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🧭</span>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Goal Style</h2>
          <p className="text-xs text-muted-foreground">Directions they’re moving toward, not fixed labels</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.map(({ pin, entry }) => (
          <div key={entry.slug} className="rounded-xl bg-secondary/50 p-3">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>{AESTHETIC_CATEGORIES.find((category) => category.id === entry.category)?.shortLabel}</span>
              <ChevronRight className="h-3 w-3" /><span>{entry.family}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">{entry.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>
            {pin.note && <p className="mt-2 border-l-2 border-primary/40 pl-2 text-xs italic leading-relaxed text-foreground/80">{pin.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default PublicGoalStyle;
