import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Photo {
  id: string;
  photo_url: string;
  display_order: number;
  is_primary: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}

const BUCKET = "ugc-media";

const PhotoManagerSheet = ({ open, onOpenChange, onChanged }: Props) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("fumble_photos")
      .select("id, photo_url, display_order, is_primary")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });
    if (!error && data) setPhotos(data as Photo[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open, user]);

  const handleFiles = async (files: FileList | null) => {
    if (!user || !files || files.length === 0) return;
    setUploading(true);
    try {
      const baseOrder = photos.length
        ? Math.max(...photos.map((p) => p.display_order)) + 1
        : 0;
      let i = 0;
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/profile/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insErr } = await supabase.from("fumble_photos").insert({
          user_id: user.id,
          photo_url: pub.publicUrl,
          display_order: baseOrder + i,
          is_primary: photos.length === 0 && i === 0,
        });
        if (insErr) throw insErr;
        i++;
      }
      toast.success(`Uploaded ${i} photo${i > 1 ? "s" : ""}`);
      await load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deletePhoto = async (p: Photo) => {
    if (!user) return;
    const { error } = await supabase
      .from("fumble_photos")
      .delete()
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    // best-effort storage cleanup: parse path from URL
    try {
      const marker = `/${BUCKET}/`;
      const idx = p.photo_url.indexOf(marker);
      if (idx >= 0) {
        const key = p.photo_url.slice(idx + marker.length);
        await supabase.storage.from(BUCKET).remove([decodeURIComponent(key)]);
      }
    } catch {}
    await load();
    onChanged?.();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= photos.length) return;
    const a = photos[index];
    const b = photos[j];
    // swap display_order
    await supabase
      .from("fumble_photos")
      .update({ display_order: b.display_order })
      .eq("id", a.id);
    await supabase
      .from("fumble_photos")
      .update({ display_order: a.display_order })
      .eq("id", b.id);
    await load();
    onChanged?.();
  };

  const setPrimary = async (p: Photo) => {
    if (!user) return;
    await supabase
      .from("fumble_photos")
      .update({ is_primary: false })
      .eq("user_id", user.id);
    await supabase
      .from("fumble_photos")
      .update({ is_primary: true })
      .eq("id", p.id);
    // Sync to profiles.avatar_url
    await supabase
      .from("profiles")
      .update({ avatar_url: p.photo_url })
      .eq("id", user.id);
    toast.success("Set as primary photo");
    await load();
    onChanged?.();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background"
        >
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pt-3 pb-3 px-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Photos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your gallery. Star sets your avatar.
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full bg-secondary p-2"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-8 space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-6 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              {uploading ? "Uploading…" : "Add photos"}
            </button>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : photos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No photos yet — add some above.
              </p>
            ) : (
              <div className="space-y-2">
                {photos.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl bg-card p-2 shadow-card"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={p.photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {p.is_primary && (
                        <div className="absolute top-0.5 right-0.5 rounded-full bg-primary p-1 shadow">
                          <Star
                            className="h-3 w-3 text-primary-foreground"
                            fill="currentColor"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground">
                      #{i + 1}
                      {p.is_primary && (
                        <span className="ml-2 text-primary font-semibold">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="rounded-full bg-secondary p-2 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === photos.length - 1}
                        className="rounded-full bg-secondary p-2 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      {!p.is_primary && (
                        <button
                          onClick={() => setPrimary(p)}
                          className="rounded-full bg-secondary p-2"
                          title="Set as primary avatar"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deletePhoto(p)}
                        className="rounded-full bg-destructive/10 p-2 text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoManagerSheet;
