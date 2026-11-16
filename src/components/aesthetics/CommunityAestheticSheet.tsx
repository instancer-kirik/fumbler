import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AESTHETIC_CATEGORIES, slugifyAesthetic, type AestheticCategory, type AestheticEntry } from "@/data/aesthetics";
import { useAddCommunityAesthetic } from "@/hooks/use-aesthetics";

const inputClass = "w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (entry: AestheticEntry) => void;
}

const CommunityAestheticSheet = ({ open, onOpenChange, onAdded }: Props) => {
  const add = useAddCommunityAesthetic();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AestheticCategory>("art");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [related, setRelated] = useState("");

  const submit = () => {
    if (!name.trim() || !summary.trim()) return;
    add.mutate(
      {
        name,
        category,
        summary,
        description,
        tags: tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean),
        related: related.split(",").map(slugifyAesthetic).filter(Boolean),
      },
      {
        onSuccess: (entry) => {
          toast.success("Added to the community atlas");
          setName(""); setSummary(""); setDescription(""); setTags(""); setRelated("");
          onOpenChange(false);
          onAdded(entry);
        },
        onError: (error: any) => toast.error(error?.message?.includes("duplicate") ? "That style name is already in the atlas" : "Couldn't add this aesthetic"),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[70] max-h-[88vh] overflow-y-auto rounded-t-3xl px-5 pb-8 pt-6">
        <SheetHeader className="mb-5 text-left">
          <SheetTitle className="font-display text-xl">Add to the atlas</SheetTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">Name a style, scene, or atmosphere you know. Text only; link culture can stay on Pinterest, Are.na, or wherever it already lives.</p>
        </SheetHeader>
        <div className="space-y-3">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name (for example, Cozy Rocket Workshop)" maxLength={80} />
          <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value as AestheticCategory)}>
            {AESTHETIC_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <textarea className={`${inputClass} min-h-20 resize-none`} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="One useful sentence: what does it feel like?" maxLength={220} />
          <textarea className={`${inputClass} min-h-28 resize-none`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What distinguishes it? Materials, sounds, behaviors, history, or common misconceptions…" maxLength={1200} />
          <input className={inputClass} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags, separated by commas" maxLength={240} />
          <input className={inputClass} value={related} onChange={(event) => setRelated(event.target.value)} placeholder="Related styles, separated by commas (optional)" maxLength={240} />
          <p className="text-[11px] leading-relaxed text-muted-foreground">Community entries are publicly browsable. Related links appear when their names match another atlas entry.</p>
          <Button className="w-full rounded-2xl" disabled={!name.trim() || !summary.trim() || add.isPending} onClick={submit}>
            <Plus className="mr-2 h-4 w-4" />{add.isPending ? "Adding…" : "Add to public atlas"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommunityAestheticSheet;
