import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RSVPStatus = "going" | "interested" | "waitlist";

export interface Meetup {
  id: string;
  host_id: string;
  title: string;
  category: string;
  description: string;
  location_name: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  status: "published" | "cancelled";
  created_at: string;
  updated_at: string;
  host_name: string | null;
  host_username: string | null;
  host_avatar_url: string | null;
  going_count: number;
  interested_count: number;
  viewer_status: RSVPStatus | null;
}

export interface MeetupInput {
  id?: string;
  title: string;
  category: string;
  description: string;
  location_name: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  status?: "published" | "cancelled";
}

export function useMeetups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fumble-meetups", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<Meetup[]> => {
      const { data, error } = await supabase.rpc("get_fumble_meetups");
      if (error) throw error;
      return (data || []) as unknown as Meetup[];
    },
  });
}

export function useSaveMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MeetupInput) => {
      if (!user) throw new Error("Sign in to host a meetup");
      const { id, ...values } = input;
      const query = id
        ? supabase.from("fumble_meetups").update(values).eq("id", id).eq("host_id", user.id)
        : supabase.from("fumble_meetups").insert({ ...values, host_id: user.id });
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fumble-meetups", user?.id] }),
  });
}

export function useRespondToMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ meetupId, status }: { meetupId: string; status: "going" | "interested" }) => {
      if (!user) throw new Error("Sign in to respond");
      const { data: existing, error: lookupError } = await supabase
        .from("fumble_meetup_rsvps")
        .select("id")
        .eq("meetup_id", meetupId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (lookupError) throw lookupError;

      // A separate insert/update avoids an upsert's insert trigger mistaking an
      // existing “going” response for a new guest when the plan is already full.
      const query = existing
        ? supabase.from("fumble_meetup_rsvps").update({ status }).eq("id", existing.id).eq("user_id", user.id)
        : supabase.from("fumble_meetup_rsvps").insert({ meetup_id: meetupId, user_id: user.id, status });
      const { data, error } = await query.select("status").single();
      if (error) throw error;
      return data.status as RSVPStatus;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fumble-meetups", user?.id] }),
  });
}

export function useWithdrawFromMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (meetupId: string) => {
      if (!user) throw new Error("Sign in to withdraw");
      const { error } = await supabase
        .from("fumble_meetup_rsvps")
        .delete()
        .eq("meetup_id", meetupId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fumble-meetups", user?.id] }),
  });
}

export interface MeetupResponse {
  user_id: string;
  status: RSVPStatus;
  name: string;
  username: string | null;
}

export function useMeetupResponses(meetupId: string | null, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fumble-meetup-responses", meetupId, user?.id],
    enabled: !!user && !!meetupId && enabled,
    queryFn: async (): Promise<MeetupResponse[]> => {
      const { data: responses, error } = await supabase
        .from("fumble_meetup_rsvps")
        .select("user_id, status")
        .eq("meetup_id", meetupId!);
      if (error) throw error;
      if (!responses?.length) return [];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", responses.map((response) => response.user_id));
      if (profileError) throw profileError;
      const names = new Map((profiles || []).map((profile) => [profile.id, profile]));
      return responses.map((response) => ({
        user_id: response.user_id,
        status: response.status as RSVPStatus,
        name: names.get(response.user_id)?.full_name || "Fumbler member",
        username: names.get(response.user_id)?.username || null,
      }));
    },
  });
}
