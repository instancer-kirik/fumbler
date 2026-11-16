import { Bookmark, BookmarkCheck, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AESTHETIC_CATEGORIES, type AestheticEntry } from "@/data/aesthetics";

interface Props {
  entry: AestheticEntry | null;
  entriesBySlug: Map<string, AestheticEntry>;
  saved: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleSave: () => void;
  onSelectRelated: (entry: AestheticEntry) => void;
}

const AestheticDetailsSheet = ({ entry, entriesBySlug, saved, saving, onOpenChange, onToggleSave, onSelectRelated }: Props) => {
  if (!entry) return null;
  const category = AESTHETIC_CATEGORIES.find((item) => item.id === entry.category);
  const related = entry.related.map((slug) => entriesBySlug.get(slug)).filter(Boolean) as AestheticEntry[];

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[70] max-h-[82vh] overflow-y-auto rounded-t-3xl px-5 pb-8 pt-6">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>{category?.label}</span><ChevronRight className="h-3 w-3" /><span>{entry.family}</span>
          </div>
          <SheetTitle className="font-display text-2xl text-foreground">{entry.name}</SheetTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <p className="text-sm leading-7 text-foreground/90">{entry.description || "No longer description yet. Add your own interpretation when you save it to Goal Style."}</p>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{tag}</span>)}
          </div>

          {related.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cross-links, not subcategories</p>
              <div className="space-y-2">
                {related.map((item) => (
                  <button key={item.slug} onClick={() => onSelectRelated(item)} className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left transition-colors hover:bg-secondary">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.summary}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={onToggleSave} disabled={saving} variant={saved ? "outline" : "default"} className="w-full rounded-2xl">
            {saved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
            {saved ? "Remove from Goal Style" : "Save to Goal Style"}
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">Saving means “this belongs in my direction,” not “this label defines me.” Add a note from your Goal Style list.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AestheticDetailsSheet;
