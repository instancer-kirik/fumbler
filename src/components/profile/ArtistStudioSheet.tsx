import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Music2, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ArtistProfileFields, { type ArtistProfileDraft } from "@/components/artists/ArtistProfileFields";
import ArtistMediaPicker, { type PendingArtistMedia } from "@/components/artists/ArtistMediaPicker";
import { useOwnArtist } from "@/hooks/use-artists";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ARTIST_MEDIA_BUCKET,
  safeUploadFilename,
  splitCommaValues,
  validateHttpUrl,
  validateMediaFile,
  type ArtistRecord,
} from "@/lib/artist-media";

const emptyProfile: ArtistProfileDraft = {
  name: "", type: "musician", subtype: "", location: "", bio: "", styles: "", tags: "",
};

const emptyMedia: PendingArtistMedia = {
  kind: "audio", title: "", description: "", sourceMode: "link", url: "", file: null,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const profilePayload = (profile: ArtistProfileDraft) => ({
  name: profile.name.trim(),
  type: profile.type,
  subtype: profile.subtype.trim() || null,
  location: profile.location.trim() || null,
  bio: profile.bio.trim() || null,
  styles: splitCommaValues(profile.styles),
  tags: splitCommaValues(profile.tags),
});

const ArtistStudioSheet = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ownArtist = useOwnArtist(open);
  const artist = ownArtist.data;
  const [profile, setProfile] = useState<ArtistProfileDraft>(emptyProfile);
  const [media, setMedia] = useState<PendingArtistMedia>(emptyMedia);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProfile(artist ? {
      name: artist.name,
      type: artist.type || "musician",
      subtype: artist.subtype || "",
      location: artist.location || "",
      bio: artist.bio || "",
      styles: (artist.styles || []).join(", "),
      tags: (artist.tags || []).join(", "),
    } : emptyProfile);
  }, [artist, open]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["own-artist", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["artist-suggestions"] });
    await ownArtist.refetch();
  };

  const ensureArtist = async (): Promise<ArtistRecord> => {
    if (artist) return artist;
    if (!user) throw new Error("Sign in to create an artist profile.");
    if (!profile.name.trim()) throw new Error("Add an artist or project name first.");
    const { data, error } = await supabase
      .from("artists")
      .insert({ ...profilePayload(profile), owner_id: user.id, is_discoverable: false })
      .select("id, owner_id, name, type, subtype, location, bio, tags, styles, disciplines, image_url, is_discoverable")
      .single();
    if (error) throw error;
    return { ...(data as ArtistRecord), artist_media: [] };
  };

  const saveProfile = async () => {
    if (!user || saving) return;
    if (!profile.name.trim()) return toast.error("Add an artist or project name first.");
    setSaving(true);
    try {
      if (artist) {
        const { error } = await supabase.from("artists").update(profilePayload(profile)).eq("id", artist.id).eq("owner_id", user.id);
        if (error) throw error;
      } else {
        await ensureArtist();
      }
      await refresh();
      toast.success("Artist profile saved.");
    } catch (error: any) {
      toast.error(error.message || "Could not save your artist profile.");
    } finally {
      setSaving(false);
    }
  };

  const addMedia = async () => {
    if (!user || saving) return;
    const validation = media.sourceMode === "link"
      ? validateHttpUrl(media.url)
      : media.file
        ? validateMediaFile(media.file, media.kind)
        : "Choose a file to upload.";
    if (validation) return toast.error(validation);

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      const currentArtist = await ensureArtist();
      let mediaUrl = media.url.trim();
      if (media.sourceMode === "upload" && media.file) {
        uploadedPath = `${currentArtist.id}/${crypto.randomUUID()}.${safeUploadFilename(media.file.name)}`;
        const { error } = await supabase.storage.from(ARTIST_MEDIA_BUCKET).upload(uploadedPath, media.file, { contentType: media.file.type, upsert: false });
        if (error) throw error;
        mediaUrl = supabase.storage.from(ARTIST_MEDIA_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
      }
      const nextPosition = currentArtist.artist_media.length
        ? Math.max(...currentArtist.artist_media.map((item) => item.position)) + 1
        : 0;
      const { error: insertError } = await supabase.from("artist_media").insert({
        artist_id: currentArtist.id,
        kind: media.kind,
        title: media.title.trim() || (media.kind === "audio" ? "Demo" : "Selected work"),
        description: media.description.trim() || null,
        url: mediaUrl,
        storage_path: uploadedPath,
        mime_type: media.file?.type || null,
        position: nextPosition,
      });
      if (insertError) throw insertError;
      const { error: publishError } = await supabase.from("artists").update({ is_discoverable: true }).eq("id", currentArtist.id).eq("owner_id", user.id);
      if (publishError) throw publishError;
      setMedia(emptyMedia);
      await refresh();
      toast.success("Intro added. Your artist is visible in Follow.");
    } catch (error: any) {
      if (uploadedPath) await supabase.storage.from(ARTIST_MEDIA_BUCKET).remove([uploadedPath]);
      toast.error(error.message || "Could not add this intro.");
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = async (id: string) => {
    if (!artist || !user || saving) return;
    const item = artist.artist_media.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Remove “${item.title}” from your artist intro?`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("artist_media").delete().eq("id", id);
      if (error) throw error;
      if (item.storage_path) await supabase.storage.from(ARTIST_MEDIA_BUCKET).remove([item.storage_path]);
      if (artist.artist_media.length === 1) {
        await supabase.from("artists").update({ is_discoverable: false }).eq("id", artist.id).eq("owner_id", user.id);
      }
      await refresh();
      toast.success("Intro removed.");
    } catch (error: any) {
      toast.error(error.message || "Could not remove this intro.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDiscovery = async () => {
    if (!artist || !user || saving) return;
    if (!artist.is_discoverable && artist.artist_media.length === 0) {
      return toast.error("Add a demo or artwork before appearing in Follow.");
    }
    setSaving(true);
    const { error } = await supabase.from("artists").update({ is_discoverable: !artist.is_discoverable }).eq("id", artist.id).eq("owner_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success(artist.is_discoverable ? "Artist hidden from Follow." : "Artist visible in Follow.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[70] max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-border p-0">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pb-4 pt-3 backdrop-blur-lg">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="pr-8 text-left">
            <SheetTitle className="font-display text-xl">Artist intro & media</SheetTitle>
            <SheetDescription>Give people something to hear or see before they follow.</SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-5 px-5 py-5 pb-10">
          {ownArtist.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {artist && (
                <button type="button" onClick={toggleDiscovery} disabled={saving} className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left ring-1 ${artist.is_discoverable ? "bg-primary/10 ring-primary/30" : "bg-card ring-border"}`}>
                  {artist.is_discoverable ? <Eye className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">{artist.is_discoverable ? "Visible in Follow" : "Hidden from Follow"}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Your uploaded files remain private and use temporary preview links.</span>
                  </span>
                </button>
              )}

              <ArtistProfileFields value={profile} onChange={setProfile} disabled={saving} idPrefix="studio-artist" />
              <button type="button" onClick={saveProfile} disabled={saving || !profile.name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save artist details
              </button>

              <div className="border-t border-border pt-5">
                <h3 className="font-display text-base font-semibold text-foreground">Add an intro</h3>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">A direct demo link, streaming page, artwork URL, or upload.</p>
                <ArtistMediaPicker value={media} onChange={setMedia} disabled={saving} idPrefix="studio-media" />
                <button type="button" onClick={addMedia} disabled={saving || !profile.name.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-warm py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music2 className="h-4 w-4" />} Add intro & show in Follow
                </button>
              </div>

              {artist?.artist_media.length ? (
                <div className="border-t border-border pt-5">
                  <h3 className="mb-3 font-display text-base font-semibold text-foreground">Your intro material</h3>
                  <div className="space-y-2">
                    {artist.artist_media.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                          {item.kind === "image" ? <img src={item.url} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs capitalize text-muted-foreground">{item.kind === "audio" ? "Demo track" : "Artwork"}</p>
                        </div>
                        <button type="button" aria-label={`Remove ${item.title}`} onClick={() => removeMedia(item.id)} disabled={saving} className="rounded-xl bg-secondary p-2.5 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ArtistStudioSheet;
