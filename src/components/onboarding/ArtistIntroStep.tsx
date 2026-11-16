import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ArtistProfileFields, { type ArtistProfileDraft } from "@/components/artists/ArtistProfileFields";
import ArtistMediaPicker, { type PendingArtistMedia } from "@/components/artists/ArtistMediaPicker";
import {
  ARTIST_MEDIA_BUCKET,
  safeUploadFilename,
  splitCommaValues,
  validateHttpUrl,
  validateMediaFile,
} from "@/lib/artist-media";

const emptyProfile: ArtistProfileDraft = {
  name: "", type: "musician", subtype: "", location: "", bio: "", styles: "", tags: "",
};

const emptyMedia: PendingArtistMedia = {
  kind: "audio", title: "", description: "", sourceMode: "link", url: "", file: null,
};

interface Props {
  defaultName: string;
  onBack: () => void;
}

const ArtistIntroStep = ({ defaultName, onBack }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [profile, setProfile] = useState<ArtistProfileDraft>({ ...emptyProfile, name: defaultName });
  const [media, setMedia] = useState<PendingArtistMedia>(emptyMedia);
  const [saving, setSaving] = useState(false);

  const finish = () => navigate("/discover");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    if (!enabled) return finish();

    const mediaError = media.sourceMode === "link"
      ? validateHttpUrl(media.url)
      : media.file
        ? validateMediaFile(media.file, media.kind)
        : "Choose a file to upload.";
    if (mediaError) return toast.error(mediaError);

    setSaving(true);
    let artistId: string | null = null;
    let uploadedPath: string | null = null;
    try {
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .insert({
          owner_id: user.id,
          name: profile.name.trim(),
          type: profile.type,
          subtype: profile.subtype.trim() || null,
          location: profile.location.trim() || null,
          bio: profile.bio.trim() || null,
          styles: splitCommaValues(profile.styles),
          tags: splitCommaValues(profile.tags),
          is_discoverable: false,
        })
        .select("id")
        .single();
      if (artistError) throw artistError;
      artistId = artist.id;

      let mediaUrl = media.url.trim();
      if (media.sourceMode === "upload" && media.file) {
        uploadedPath = `${artist.id}/${crypto.randomUUID()}.${safeUploadFilename(media.file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from(ARTIST_MEDIA_BUCKET)
          .upload(uploadedPath, media.file, { contentType: media.file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(ARTIST_MEDIA_BUCKET).getPublicUrl(uploadedPath);
        mediaUrl = data.publicUrl;
      }

      const { error: mediaInsertError } = await supabase.from("artist_media").insert({
        artist_id: artist.id,
        kind: media.kind,
        title: media.title.trim() || (media.kind === "audio" ? "Demo" : "Selected work"),
        description: media.description.trim() || null,
        url: mediaUrl,
        storage_path: uploadedPath,
        mime_type: media.file?.type || null,
        position: 0,
      });
      if (mediaInsertError) throw mediaInsertError;

      const { error: publishError } = await supabase
        .from("artists")
        .update({ is_discoverable: true })
        .eq("id", artist.id)
        .eq("owner_id", user.id);
      if (publishError) throw publishError;

      toast.success("Your artist intro is ready for Follow.");
      finish();
    } catch (error: any) {
      if (artistId) {
        await supabase.from("artists").delete().eq("id", artistId).eq("owner_id", user.id);
      }
      if (uploadedPath) await supabase.storage.from(ARTIST_MEDIA_BUCKET).remove([uploadedPath]);
      toast.error(error.message || "Could not save your artist intro. Your basic profile is still saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Optional artist setup</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Show the work, not just the bio.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Add one demo or artwork for Follow suggestions. You can add more later, or skip this entirely.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setEnabled(true)} className={`rounded-2xl p-4 text-left ring-1 transition-colors ${enabled ? "bg-primary/10 ring-primary" : "bg-card ring-border"}`}>
          <Sparkles className="mb-2 h-5 w-5 text-primary" />
          <span className="block text-sm font-semibold text-foreground">I make things</span>
          <span className="mt-1 block text-xs text-muted-foreground">Add an artist intro</span>
        </button>
        <button type="button" onClick={() => setEnabled(false)} className={`rounded-2xl p-4 text-left ring-1 transition-colors ${!enabled ? "bg-primary/10 ring-primary" : "bg-card ring-border"}`}>
          <span className="block pt-7 text-sm font-semibold text-foreground">Skip for now</span>
          <span className="mt-1 block text-xs text-muted-foreground">Set this up from Profile later</span>
        </button>
      </div>

      {enabled && (
        <>
          <ArtistProfileFields value={profile} onChange={setProfile} disabled={saving} idPrefix="onboarding-artist" />
          <ArtistMediaPicker value={media} onChange={setMedia} disabled={saving} idPrefix="onboarding-media" />
        </>
      )}

      <div className="flex gap-3 pb-6">
        <button type="button" onClick={onBack} disabled={saving} className="flex items-center justify-center gap-1 rounded-2xl bg-secondary px-4 py-3.5 text-sm font-semibold text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit" disabled={saving || (enabled && !profile.name.trim())} className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving intro…" : enabled ? "Publish intro & continue" : "Continue to Fumbler"}
        </button>
      </div>
    </form>
  );
};

export default ArtistIntroStep;
