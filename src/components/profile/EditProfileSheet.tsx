import { useEffect, useState } from "react";
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

const GENDERS = ["Woman", "Man", "Non-binary", "Trans", "Other"];
const ORIENTATIONS = ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Asexual", "Queer", "Other"];
const INTERESTED_IN = ["Women", "Men", "Non-binary", "Everyone"];
const LOOKING_FOR = ["Platonic", "Romantic", "Casual", "Serious", "Play", "Collab"];

const EditProfileSheet = ({ open, onOpenChange, profile, onSaved }: EditProfileSheetProps) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string[]>([]);
  const [genderDescription, setGenderDescription] = useState("");
  const [orientation, setOrientation] = useState("");
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [saving, setSaving] = useState(false);

  // Load full row (including new prefs) when opened
  useEffect(() => {
    if (!open || !profile) return;
    setName(profile.full_name || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setAge(profile.age?.toString() || "");
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("gender, gender_description, orientation, interested_in, looking_for, age_min, age_max")
        .eq("id", profile.id)
        .maybeSingle();
      const row = data as any;
      if (row) {
        setGender(Array.isArray(row.gender) ? row.gender : row.gender ? [row.gender] : []);
        setGenderDescription(row.gender_description || "");
        setOrientation(row.orientation || "");
        setInterestedIn(row.interested_in || []);
        setLookingFor(row.looking_for || []);
        setAgeMin(row.age_min?.toString() || "");
        setAgeMax(row.age_max?.toString() || "");
      }
    })();
  }, [open, profile]);

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const patch: any = {
      full_name: name || null,
      username: username || null,
      bio: bio || null,
      age: age ? parseInt(age) : null,
      gender,
      gender_description: genderDescription || null,
      orientation: orientation || null,
      interested_in: interestedIn,
      looking_for: lookingFor,
      age_min: ageMin ? parseInt(ageMin) : null,
      age_max: ageMax ? parseInt(ageMax) : null,
    };
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    setSaving(false);
    if (error) toast.error("Failed to save: " + error.message);
    else {
      toast.success("Profile updated!");
      onSaved();
      onOpenChange(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all";

  const Chip = ({ active, onClick, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-foreground hover:bg-secondary/80"
      }`}
    >
      {children}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-background max-h-[90vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="font-display text-lg">Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5 pb-6 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="18+" min={18} max={120} className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about you..." maxLength={300} rows={3} className={inputClass + " resize-none"} />
          </div>

          <div className="pt-2 border-t border-border" />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Gender</label>
            <div className="flex flex-wrap gap-1.5">
              {GENDERS.map((g) => (
                <Chip key={g} active={gender === g} onClick={() => setGender(gender === g ? "" : g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Orientation</label>
            <div className="flex flex-wrap gap-1.5">
              {ORIENTATIONS.map((o) => (
                <Chip key={o} active={orientation === o} onClick={() => setOrientation(orientation === o ? "" : o)}>
                  {o}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Interested in</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTED_IN.map((i) => (
                <Chip key={i} active={interestedIn.includes(i)} onClick={() => toggle(interestedIn, i, setInterestedIn)}>
                  {i}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Looking for</label>
            <div className="flex flex-wrap gap-1.5">
              {LOOKING_FOR.map((l) => (
                <Chip key={l} active={lookingFor.includes(l)} onClick={() => toggle(lookingFor, l, setLookingFor)}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Age range preference (leave blank for any age)
            </label>
            <div className="flex gap-2 items-center">
              <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="Min" min={18} max={120} className={inputClass} />
              <span className="text-muted-foreground text-sm">to</span>
              <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="Max" min={18} max={120} className={inputClass} />
            </div>
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
