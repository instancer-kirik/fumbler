import { Bookmark, BookmarkCheck, ChevronRight } from "lucide-react";
import { AESTHETIC_CATEGORIES, type AestheticEntry } from "@/data/aesthetics";

interface Props {
  entry: AestheticEntry;
  saved: boolean;
  saving?: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}

const AestheticCard = ({ entry, saved, saving, onOpen, onToggleSave }: Props) => {
  const category = AESTHETIC_CATEGORIES.find((item) => item.id === entry.category);
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-colors hover:border-primary/40">
      <button onClick={onOpen} className="flex min-h-44 w-full flex-col p-4 pr-11 text-left">
        <div className="mb-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{category?.shortLabel}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate">{entry.family}</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight text-foreground">{entry.name}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-3">
          {entry.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{tag}</span>
          ))}
        </div>
      </button>
      <button
        aria-label={saved ? `Remove ${entry.name} from Goal Style` : `Save ${entry.name} to Goal Style`}
        title={saved ? "Remove from Goal Style" : "Save to Goal Style"}
        disabled={saving}
        onClick={onToggleSave}
        className={`absolute right-3 top-3 rounded-xl p-2 transition-colors ${saved ? "gradient-warm text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
      >
        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>
    </article>
  );
};

export default AestheticCard;
