import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ResonanceProfile } from "@/data/resonance-profile";

export interface MatchRow {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  tags: string[];
  notes: string;
  scheduled_date: string | null;
  last_interaction_at: string;
  contact_shared_by_user1: boolean;
  contact_shared_by_user2: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchWithProfile {
  match: MatchRow;
  profile: ResonanceProfile;
  amUser1: boolean;
}

// Build a minimal ResonanceProfile from DB row
const dbToProfile = (row: any): ResonanceProfile => ({
  id: row.id,
  name: row.full_name || "Anonymous",
  handle: `@${row.username || "unknown"}`,
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

export function useMatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["matches", user?.id],
    queryFn: async (): Promise<MatchWithProfile[]> => {
      if (!user) return [];

      const { data: matchRows, error: matchError } = await supabase
        .from("matches")
        .select("*" as any)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchError || !matchRows?.length) return [];

      const otherIds = matchRows.map((m: any) =>
        m.user1_id === user.id ? m.user2_id : m.user1_id,
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url, bio, age, contact_methods",
        )
        .in("id", otherIds);

      if (!profiles) return [];

      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

      return matchRows
        .map((match: any) => {
          const amUser1 = match.user1_id === user.id;
          const otherId = amUser1 ? match.user2_id : match.user1_id;
          const profileRow = profileMap.get(otherId);
          if (!profileRow) return null;
          return {
            match: match as MatchRow,
            profile: dbToProfile(profileRow),
            amUser1,
          };
        })
        .filter(Boolean) as MatchWithProfile[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 min cache
    gcTime: 1000 * 60 * 10,
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      matchId,
      updates,
    }: {
      matchId: string;
      updates: Partial<
        Pick<
          MatchRow,
          | "tags"
          | "notes"
          | "scheduled_date"
          | "status"
          | "last_interaction_at"
          | "contact_shared_by_user1"
          | "contact_shared_by_user2"
        >
      >;
    }) => {
      const { error } = await (supabase.from("matches") as any)
        .update(updates)
        .eq("id", matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", user?.id] });
    },
  });
}

export function useMatchContactMethods(profileId: string | undefined) {
  return useQuery({
    queryKey: ["contact-methods", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("contact_methods" as any)
        .eq("id", profileId)
        .maybeSingle();
      return ((data as any)?.contact_methods as Record<string, string>) || {};
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });
}
