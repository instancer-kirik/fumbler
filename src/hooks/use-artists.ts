import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ArtistMediaRecord, ArtistRecord } from "@/lib/artist-media";
import { ARTIST_MEDIA_BUCKET } from "@/lib/artist-media";

const artistFields = "id, owner_id, name, type, subtype, location, bio, tags, styles, disciplines, image_url, is_discoverable";
const mediaFields = "id, artist_id, kind, title, description, url, storage_path, mime_type, position";

async function resolveMediaUrls(media: ArtistMediaRecord[]): Promise<ArtistMediaRecord[]> {
  return Promise.all(
    media.map(async (item) => {
      if (!item.storage_path) return item;
      const { data, error } = await supabase.storage
        .from(ARTIST_MEDIA_BUCKET)
        .createSignedUrl(item.storage_path, 60 * 60);
      return error ? item : { ...item, url: data.signedUrl };
    }),
  );
}

export function useArtistSuggestions() {
  return useQuery({
    queryKey: ["artist-suggestions"],
    queryFn: async (): Promise<ArtistRecord[]> => {
      const { data, error } = await supabase
        .from("artists")
        .select(`${artistFields}, artist_media!inner(${mediaFields})`)
        .eq("is_discoverable", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;

      return Promise.all(
        (data || []).map(async (artist) => ({
          ...(artist as unknown as ArtistRecord),
          artist_media: await resolveMediaUrls(
            ((artist.artist_media || []) as unknown as ArtistMediaRecord[]).sort(
              (a, b) => a.position - b.position,
            ),
          ),
        })),
      );
    },
  });
}

export function useArtistFollows() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["artist-follows", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_artist_relationships")
        .select("artist_id")
        .eq("user_id", user!.id)
        .eq("role", "follow");
      if (error) throw error;
      return new Set((data || []).map((row) => row.artist_id).filter(Boolean) as string[]);
    },
  });
}

export function useToggleArtistFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistId, following }: { artistId: string; following: boolean }) => {
      if (!user) throw new Error("Sign in to follow artists.");
      const query = supabase.from("user_artist_relationships");
      const { error } = following
        ? await query.delete().eq("user_id", user.id).eq("artist_id", artistId).eq("role", "follow")
        : await query.insert({ user_id: user.id, artist_id: artistId, role: "follow" });
      if (error) throw error;
      return { artistId, following: !following };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-follows", user?.id] });
    },
  });
}

export function useOwnArtist(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["own-artist", user?.id],
    enabled: enabled && !!user,
    queryFn: async (): Promise<ArtistRecord | null> => {
      const { data: artist, error } = await supabase
        .from("artists")
        .select(artistFields)
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!artist) return null;

      const { data: media, error: mediaError } = await supabase
        .from("artist_media")
        .select(mediaFields)
        .eq("artist_id", artist.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (mediaError) throw mediaError;

      return {
        ...(artist as unknown as ArtistRecord),
        artist_media: await resolveMediaUrls((media || []) as unknown as ArtistMediaRecord[]),
      };
    },
  });
}
