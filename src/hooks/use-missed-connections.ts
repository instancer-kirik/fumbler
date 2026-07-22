import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MCCategory = "romantic" | "friendly" | "platonic" | "funny" | "collab" | "lost_found";
export type MCReactionKind = "relate" | "thats_me";

export interface MissedConnectionRow {
  id: string;
  author_id: string | null;
  category: MCCategory;
  title: string;
  location_text: string;
  city: string | null;
  encounter_time: string | null;
  description: string;
  looking_for: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface MCReactionRow {
  id: string;
  missed_connection_id: string;
  user_id: string;
  kind: MCReactionKind;
  note: string | null;
  created_at: string;
}

export interface MissedConnectionWithReactions {
  post: MissedConnectionRow;
  relateCount: number;
  claimCount: number; // visible only to author
  myReactions: MCReactionKind[];
  claimants?: { user_id: string; note: string | null; created_at: string }[];
}

export function useMissedConnections(filter?: { category?: MCCategory | "all"; city?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["missed-connections", filter?.category ?? "all", filter?.city ?? "", user?.id ?? "anon"],
    queryFn: async (): Promise<MissedConnectionWithReactions[]> => {
      // Read via the privacy view: server nulls author_id when is_anonymous=true (except for the author)
      let query = (supabase.from("missed_connections_public") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter?.category && filter.category !== "all") query = query.eq("category", filter.category);
      if (filter?.city && filter.city.trim()) query = query.ilike("city", `%${filter.city.trim()}%`);

      const { data: rawPosts, error } = await query;
      if (error) throw error;
      if (!rawPosts || rawPosts.length === 0) return [];

      const authorIds = Array.from(new Set(rawPosts.map((p: any) => p.author_id).filter(Boolean)));
      const { data: authors } = authorIds.length
        ? await (supabase.from("profiles") as any)
            .select("id, username, full_name, avatar_url")
            .in("id", authorIds)
        : { data: [] as any[] };
      const authorMap = new Map<string, any>();
      for (const a of authors || []) authorMap.set(a.id, a);
      const posts = rawPosts.map((p: any) => ({ ...p, author: p.author_id ? authorMap.get(p.author_id) || null : null }));

      const ids = posts.map((p: any) => p.id);
      const { data: reactions } = await (supabase.from("missed_connection_reactions") as any)
        .select("*")
        .in("missed_connection_id", ids);

      const byPost = new Map<string, MCReactionRow[]>();
      for (const r of (reactions as MCReactionRow[]) || []) {
        const arr = byPost.get(r.missed_connection_id) || [];
        arr.push(r);
        byPost.set(r.missed_connection_id, arr);
      }

      return (posts as MissedConnectionRow[]).map((p) => {
        const rs = byPost.get(p.id) || [];
        const relateCount = rs.filter((r) => r.kind === "relate").length;
        const claims = rs.filter((r) => r.kind === "thats_me");
        const myReactions = user ? rs.filter((r) => r.user_id === user.id).map((r) => r.kind) : [];
        return {
          post: p,
          relateCount,
          claimCount: claims.length,
          myReactions,
          claimants: user && p.author_id === user.id
            ? claims.map((c) => ({ user_id: c.user_id, note: c.note, created_at: c.created_at }))
            : undefined,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateMissedConnection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category: MCCategory;
      title: string;
      location_text: string;
      city?: string;
      encounter_time?: string;
      description: string;
      looking_for?: string;
      is_anonymous?: boolean;
    }) => {
      if (!user) throw new Error("You must be signed in to post");
      const { data, error } = await (supabase.from("missed_connections") as any)
        .insert({
          author_id: user.id,
          category: input.category,
          title: input.title.trim(),
          location_text: input.location_text.trim(),
          city: input.city?.trim() || null,
          encounter_time: input.encounter_time?.trim() || null,
          description: input.description.trim(),
          looking_for: input.looking_for?.trim() || null,
          is_anonymous: !!input.is_anonymous,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MissedConnectionRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missed-connections"] }),
  });
}

export function useDeleteMissedConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("missed_connections") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missed-connections"] }),
  });
}

export function useToggleReaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      missed_connection_id: string;
      kind: MCReactionKind;
      active: boolean;
      note?: string;
    }) => {
      if (!user) throw new Error("Sign in to react");
      if (args.active) {
        const { error } = await (supabase.from("missed_connection_reactions") as any)
          .delete()
          .eq("missed_connection_id", args.missed_connection_id)
          .eq("user_id", user.id)
          .eq("kind", args.kind);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("missed_connection_reactions") as any).insert({
          missed_connection_id: args.missed_connection_id,
          user_id: user.id,
          kind: args.kind,
          note: args.note?.trim() || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missed-connections"] }),
  });
}
