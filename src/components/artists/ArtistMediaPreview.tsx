import { ExternalLink, FileAudio } from "lucide-react";
import type { ArtistMediaRecord } from "@/lib/artist-media";
import { isExternalStreamingPage } from "@/lib/artist-media";

interface Props {
  item: ArtistMediaRecord;
  artistName: string;
}

const ArtistMediaPreview = ({ item, artistName }: Props) => {
  const streamingPage = item.kind === "audio" && isExternalStreamingPage(item.url);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/35">
      {item.kind === "image" ? (
        <a href={item.url} target="_blank" rel="noreferrer" className="block">
          <img
            src={item.url}
            alt={`${item.title} by ${artistName}`}
            loading="lazy"
            className="max-h-96 min-h-40 w-full object-cover"
          />
        </a>
      ) : (
        <div className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileAudio className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-medium text-foreground">{item.title}</span>
          </div>
          {streamingPage ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-foreground"
            >
              Open demo player <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <audio controls preload="none" src={item.url} className="h-10 w-full">
              Your browser cannot play this demo.
            </audio>
          )}
        </div>
      )}
      <div className="px-3 pb-3 pt-2">
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        )}
      </div>
    </div>
  );
};

export default ArtistMediaPreview;
