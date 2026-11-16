import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { curatedAestheticBySlug, slugifyAesthetic, type AestheticCategory, type AestheticEntry } from "@/data/aesthetics";

export type GoalStyleVisibility = "private" | "matches" | "public";
export type GoalStylePin = { id: string; aestheticSlug: string; note: string; position: number };
export type GoalStyleBoard = { id: string | null; visibility: GoalStyleVisibility; pins: GoalStylePin[] };

const emptyBoard: GoalStyleBoard = { id: null, visibility: "private", pins: [] };

const mapCommunityEntry = (row: any): AestheticEntry => ({
  slug: row.slug,
  name: row.name,
  category: row.category,
  family: "Community",
  summary: row.summary,
  description: row.description || "",
  tags: row.tags ?? [],
  related: row.related_slugs ?? [],
  source: "community",
  createdBy: row.created_by,
});

export function useCommunityAesthetics() {
  return useQuery({
    queryKey: ["community-aesthetics"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("aesthetic_entries")
        .select("slug, name, category, summary, description, tags, related_slugs, created_by")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCommunityEntry) as AestheticEntry[];
    },
  });
}

export function useGoalStyleBoard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goal-style", user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<GoalStyleBoard> => {
      const { data, error } = await (supabase as any)
        .from("aesthetic_boards")
        .select("id, visibility, aesthetic_pins(id, aesthetic_slug, note, position, created_at)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return emptyBoard;
      const pins = [...(data.aesthetic_pins ?? [])]
        .sort((a: any, b: any) => a.position - b.position || String(a.created_at).localeCompare(String(b.created_at)))
        .map((pin: any) => ({ id: pin.id, aestheticSlug: pin.aesthetic_slug, note: pin.note ?? "", position: pin.position ?? 0 }));
      return { id: data.id, visibility: data.visibility, pins };
    },
  });
}

export function useSaveGoalStyle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, note = "" }: { slug: string; note?: string }) => {
      if (!user) throw new Error("Sign in to save a style");
      const { data: board, error: boardError } = await (supabase as any)
        .from("aesthetic_boards")
        .upsert({ user_id: user.id }, { onConflict: "user_id" })
        .select("id")
        .single();
      if (boardError) throw boardError;
      const { error } = await (supabase as any)
        .from("aesthetic_pins")
        .upsert({ board_id: board.id, aesthetic_slug: slug, note }, { onConflict: "board_id,aesthetic_slug" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goal-style", user?.id] }),
  });
}

export function useRemoveGoalStyle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, slug }: { boardId: string; slug: string }) => {
      const { error } = await (supabase as any).from("aesthetic_pins").delete().eq("board_id", boardId).eq("aesthetic_slug", slug);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goal-style", user?.id] }),
  });
}

export function useGoalStyleVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visibility: GoalStyleVisibility) => {
      if (!user) throw new Error("Sign in to change visibility");
      const { error } = await (supabase as any).from("aesthetic_boards").upsert({ user_id: user.id, visibility }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goal-style", user?.id] }),
  });
}

export function useAddCommunityAesthetic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; category: AestheticCategory; summary: string; description: string; tags: string[]; related: string[] }) => {
      if (!user) throw new Error("Sign in to add an aesthetic");
      const slug = slugifyAesthetic(input.name);
      if (!slug) throw new Error("Give the aesthetic a name");
      const { data, error } = await (supabase as any)
        .from("aesthetic_entries")
        .insert({
          slug,
          name: input.name.trim(),
          category: input.category,
          summary: input.summary.trim(),
          description: input.description.trim(),
          tags: input.tags,
          related_slugs: input.related.map(slugifyAesthetic).filter(Boolean),
          created_by: user.id,
        })
        .select("slug, name, category, summary, description, tags, related_slugs, created_by")
        .single();
      if (error) throw error;
      return mapCommunityEntry(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-aesthetics"] }),
  });
}
