export const ARTIST_MEDIA_BUCKET = "artist-media";
export const MAX_ARTIST_MEDIA_BYTES = 50 * 1024 * 1024;

export type ArtistMediaKind = "audio" | "image";

export interface ArtistMediaRecord {
  id: string;
  artist_id?: string;
  kind: ArtistMediaKind;
  title: string;
  description: string | null;
  url: string;
  storage_path: string | null;
  mime_type: string | null;
  position: number;
}

export interface ArtistRecord {
  id: string;
  owner_id?: string | null;
  name: string;
  type: string | null;
  subtype: string | null;
  location: string | null;
  bio: string | null;
  tags: string[] | null;
  styles: string[] | null;
  disciplines: string[] | null;
  image_url: string | null;
  is_discoverable?: boolean;
  artist_media: ArtistMediaRecord[];
}

export function validateHttpUrl(value: string): string | null {
  if (!value.trim()) return "Add a link or choose a file.";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "Use an http:// or https:// link.";
    }
    return null;
  } catch {
    return "Enter a complete, valid URL.";
  }
}

export function validateMediaFile(
  file: File,
  kind: ArtistMediaKind,
): string | null {
  const expectedType = kind === "audio" ? "audio/" : "image/";
  if (!file.type.startsWith(expectedType)) {
    return kind === "audio"
      ? "Choose an audio file such as MP3, WAV, OGG, or M4A."
      : "Choose an image file such as JPG, PNG, GIF, or WebP.";
  }
  if (file.size > MAX_ARTIST_MEDIA_BYTES) {
    return "Files must be 50 MB or smaller.";
  }
  return null;
}

export function splitCommaValues(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function isExternalStreamingPage(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return [
      "soundcloud.com",
      "open.spotify.com",
      "spotify.com",
      "youtube.com",
      "youtu.be",
      "bandcamp.com",
      "audiomack.com",
      "apple.com",
    ].some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function safeUploadFilename(filename: string): string {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "bin";
  return (extension || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "bin";
}

export function mediaInputAccept(kind: ArtistMediaKind): string {
  return kind === "audio"
    ? "audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
    : "image/*,.jpg,.jpeg,.png,.gif,.webp,.avif";
}
