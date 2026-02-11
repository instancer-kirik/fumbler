import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    full_name: string | null;
    username: string | null;
    bio: string | null;
    age: number | null;
  } | null;
  onSaved: () => void;
}

const EditProfileSheet = ({ open, onOpenChange, profile, onSaved }: EditProfileSheetProps) => {
  const [name, setName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [age, setAge] = useState(profile?.age?.toString() || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name || null,
        username: username || null,
        bio: bio || null,
        age: age ? parseInt(age) : null,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Profile updated!");
      onSaved();
      onOpenChange(false);
    }
  };

  // Sync state when profile changes
  if (open && profile) {
    if (name === "" && profile.full_name) setName(profile.full_name);
  }

  const inputClass = "w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-background max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 pb-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="18+" min={18} max={120} className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about you..." maxLength={300} rows={3} className={inputClass + " resize-none"} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditProfileSheet;
