import { useState } from "react";
import { Link2, Upload } from "lucide-react";
import {
  mediaInputAccept,
  validateHttpUrl,
  validateMediaFile,
  type ArtistMediaKind,
} from "@/lib/artist-media";

export interface PendingArtistMedia {
  kind: ArtistMediaKind;
  title: string;
  description: string;
  sourceMode: "link" | "upload";
  url: string;
  file: File | null;
}

interface Props {
  value: PendingArtistMedia;
  onChange: (value: PendingArtistMedia) => void;
  disabled?: boolean;
  idPrefix?: string;
}

const ArtistMediaPicker = ({ value, onChange, disabled = false, idPrefix = "artist-media" }: Props) => {
  const [error, setError] = useState("");
  const update = (patch: Partial<PendingArtistMedia>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-secondary/25 p-3">
      <div className="grid grid-cols-2 gap-2">
        {(["audio", "image"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            onClick={() => update({ kind, file: null, url: "" })}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              value.kind === kind ? "gradient-warm text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            {kind === "audio" ? "Demo track" : "Artwork"}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-title`} className="mb-1 block text-xs font-medium text-muted-foreground">
          Intro title
        </label>
        <input
          id={`${idPrefix}-title`}
          value={value.title}
          disabled={disabled}
          onChange={(event) => update({ title: event.target.value })}
          maxLength={100}
          placeholder={value.kind === "audio" ? "Demo, EP, or track name" : "Piece or collection name"}
          className="w-full rounded-xl bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["link", "upload"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => update({ sourceMode: mode, file: null })}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ${
              value.sourceMode === mode ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            {mode === "link" ? <Link2 className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
            {mode === "link" ? "Use a link" : "Upload file"}
          </button>
        ))}
      </div>

      {value.sourceMode === "link" ? (
        <div>
          <input
            aria-label="Intro media URL"
            type="url"
            value={value.url}
            disabled={disabled}
            onChange={(event) => {
              update({ url: event.target.value });
              setError("");
            }}
            onBlur={() => setError(validateHttpUrl(value.url) || "")}
            placeholder={value.kind === "audio" ? "https://…/demo.mp3 or SoundCloud" : "https://…/artwork.jpg"}
            className="w-full rounded-xl bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {value.kind === "audio"
              ? "Direct audio links play here. SoundCloud, Bandcamp, Spotify, and similar pages open in their own player."
              : "Use a direct image URL for the in-page preview."}
          </p>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-4 text-center">
          <Upload className="mb-1.5 h-5 w-5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {value.file ? value.file.name : `Choose ${value.kind === "audio" ? "audio" : "an image"}`}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">Up to 50 MB · private storage</span>
          <input
            type="file"
            disabled={disabled}
            accept={mediaInputAccept(value.kind)}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              const validation = file ? validateMediaFile(file, value.kind) : null;
              setError(validation || "");
              update({ file: validation ? null : file });
            }}
          />
        </label>
      )}

      <textarea
        aria-label="Intro media description"
        value={value.description}
        disabled={disabled}
        onChange={(event) => update({ description: event.target.value })}
        rows={2}
        maxLength={240}
        placeholder="Optional context, credits, or what to notice"
        className="w-full resize-none rounded-xl bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
      />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default ArtistMediaPicker;
