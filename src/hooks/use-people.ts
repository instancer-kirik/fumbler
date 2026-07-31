import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const INTENTS = ["talk", "interview", "pitch", "date", "collab", "band"] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABELS: Record<Intent, string> = {
  talk: "Talk",
  interview: "Interview",
  pitch: "Pitch / Sell",
  date: "Date",
  collab: "Collab",
  band: "Band",
};

export const STATUSES = [
  "not_reached",
  "reached_out",
  "talking",
  "scheduled",
  "done",
  "passed",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  not_reached: "Not reached out",
  reached_out: "Reached out",
  talking: "Talking",
  scheduled: "Scheduled",
  done: "Done",
  passed: "Passed",
};

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CHANNELS = ["dm", "email", "phone", "irl", "instagram", "discord", "other"] as const;

export const INTERACTION_KINDS = ["note", "message", "call", "meeting", "email", "event"] as const;

export interface Person {
  id: string;
  owner_id: string;
  profile_id: string | null;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  link_url: string | null;
  intents: string[];
  status: string;
  priority: string;
  next_action: string | null;
  next_action_due: string | null;
  contact_channel: string | null;
  contact_value: string | null;
  notes: string | null;
  tags: string[];
  last_touched_at: string | null;
  reveal_to_person: boolean;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  person_id: string;
  owner_id: string;
  kind: string;
  note: string | null;
  occurred_at: string;
  created_at: string;
}

export type PersonInput = Partial<Omit<Person, "id" | "owner_id" | "created_at" | "updated_at">>;

export function usePeople() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["people", user?.id],
    enabled: !!user,
    staleTime: 1000 * 120,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people" as any)
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Person[];
    },
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: PersonInput) => {
      const { data, error } = await supabase
        .from("people" as any)
        .insert({ ...input, owner_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Person;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      toast.success("Added to your list");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PersonInput }) => {
      const { error } = await supabase
        .from("people" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("people" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      toast.success("Removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useInteractions(personId?: string) {
  return useQuery({
    queryKey: ["people-interactions", personId],
    enabled: !!personId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people_interactions" as any)
        .select("*")
        .eq("person_id", personId!)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Interaction[];
    },
  });
}

export function useLogInteraction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      personId,
      kind,
      note,
    }: {
      personId: string;
      kind: string;
      note: string;
    }) => {
      const { error } = await supabase.from("people_interactions" as any).insert({
        person_id: personId,
        owner_id: user!.id,
        kind,
        note,
      } as any);
      if (error) throw error;
      await supabase
        .from("people" as any)
        .update({ last_touched_at: new Date().toISOString() } as any)
        .eq("id", personId);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["people-interactions", v.personId] });
      qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
