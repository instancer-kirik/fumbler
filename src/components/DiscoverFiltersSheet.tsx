import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DEFAULT_EXTRA_FILTERS,
  ExtraFilters,
  ORIENTATIONS,
  PROFILE_TYPES,
  loadExtraFilters,
  saveExtraFilters,
} from "@/lib/discover-filters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const INTERESTED_IN = ["Women", "Men", "Non-binary", "Everyone"];
const LOOKING_FOR = ["Platonic", "Romantic", "Casual", "Serious", "Play", "Collab"];

const DiscoverFiltersSheet = ({ open, onOpenChange, onSaved }: Props) => {
  const { user } = useAuth();
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [extras, setExtras] = useState<ExtraFilters>(DEFAULT_EXTRA_FILTERS);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (!open) return;
    setExtras(loadExtraFilters());
    if (!user) return;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("interested_in, looking_for, age_min, age_max")
        .eq("id", user.id)
        .maybeSingle();
      const row = data as any;
      if (row) {
        setInterestedIn(row.interested_in || []);
        setLookingFor(row.looking_for || []);
        setAgeMin(row.age_min?.toString() || "");
        setAgeMax(row.age_max?.toString() || "");
      }
    })();
  }, [open, user]);

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const clampAge = (v: string): number | null => {
    if (!v) return null;
    const n = parseInt(v);
    if (Number.isNaN(n)) return null;
    return Math.min(120, Math.max(18, n));
  };

  const handleSave = async () => {
    if (!user) return;
    const minVal = clampAge(ageMin);
    const maxVal = clampAge(ageMax);
    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      toast.error("Minimum age can't be greater than maximum age");
      return;
    }
    setSaving(true);
    saveExtraFilters(extras);
    const { error } = await supabase

      .from("profiles")
      .update({
        interested_in: interestedIn,
        looking_for: lookingFor,
        age_min: minVal,
        age_max: maxVal,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Failed: " + error.message);
    else {
      toast.success("Filters saved");
      onSaved?.();
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
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
      }`}
    >
      {children}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-background max-h-[85vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="font-display text-lg">Discovery filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5 pb-6 overflow-y-auto flex-1">
          <p className="text-xs text-muted-foreground">
            These live on your profile — updating here also updates your profile prefs.
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Show me</label>
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
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Age range</label>
            <div className="flex gap-2 items-center">
              <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="Min" min={18} max={120} className={inputClass} />
              <span className="text-muted-foreground text-sm">to</span>
              <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="Max" min={18} max={120} className={inputClass} />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Apply filters"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DiscoverFiltersSheet;
