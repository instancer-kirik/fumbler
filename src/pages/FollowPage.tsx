import { useMemo, useState } from "react";
import { Check, Loader2, Plus, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ArtistMediaPreview from "@/components/artists/ArtistMediaPreview";
import { useArtistFollows, useArtistSuggestions, useToggleArtistFollow } from "@/hooks/use-artists";
import type { ArtistRecord } from "@/lib/artist-media";

const filters = [
  { id: "all", label: "All work" },
  { id: "music", label: "Music" },
  { id: "art", label: "Visual art" },
  { id: "multi", label: "Multidisciplinary" },
] as const;

type FilterId = (typeof filters)[number]["id"];

const ArtistSuggestionCard = ({ artist }: { artist: ArtistRecord }) => {
  const [showAll, setShowAll] = useState(false);
  const { data: follows } = useArtistFollows();
  const toggleFollow = useToggleArtistFollow();
  const following = follows?.has(artist.id) || false;
  const visibleMedia = showAll ? artist.artist_media : artist.artist_media.slice(0, 3);

  const handleFollow = async () => {
    try {
      await toggleFollow.mutateAsync({ artistId: artist.id, following });
      toast.success(following ? `Unfollowed ${artist.name}` : `Following ${artist.name}`);
    } catch (error: any) {
      toast.error(error.message || "Could not update this follow.");
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary font-display text-lg font-bold text-primary">
            {artist.image_url ? (
              <img src={artist.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              artist.name[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold text-foreground">{artist.name}</h2>
            <p className="text-xs text-muted-foreground">
              {[artist.subtype || artist.type, artist.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleFollow}
            disabled={toggleFollow.isPending}
            aria-label={following ? `Unfollow ${artist.name}` : `Follow ${artist.name}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              following ? "bg-secondary text-foreground" : "gradient-warm text-primary-foreground"
            } disabled:opacity-50`}
          >
            {toggleFollow.isPending && toggleFollow.variables?.artistId === artist.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : following ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {following ? "Following" : "Follow"}
          </button>
        </div>

        {artist.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/85">{artist.bio}</p>}
        {(artist.styles?.length || artist.tags?.length) ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...(artist.styles || []), ...(artist.tags || [])].slice(0, 8).map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{tag}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 px-3 pb-3">
        {visibleMedia.map((item) => (
          <ArtistMediaPreview key={item.id} item={item} artistName={artist.name} />
        ))}
        {artist.artist_media.length > 3 && (
          <button type="button" onClick={() => setShowAll((value) => !value)} className="w-full rounded-xl bg-secondary py-2 text-xs font-semibold text-foreground">
            {showAll ? "Show fewer previews" : `Show all ${artist.artist_media.length} previews`}
          </button>
        )}
      </div>
    </article>
  );
};

const FollowPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const suggestions = useArtistSuggestions();

  const artists = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (suggestions.data || []).filter((artist) => {
      const matchesFilter = filter === "all"
        || (filter === "music" && artist.type === "musician")
        || (filter === "art" && artist.type === "visual_artist")
        || (filter === "multi" && artist.type === "multidisciplinary");
      if (!matchesFilter) return false;
      if (!term) return true;
      return [artist.name, artist.bio, artist.subtype, artist.location, ...(artist.styles || []), ...(artist.tags || [])]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [filter, search, suggestions.data]);

  return (
    <div className="min-h-screen bg-background px-4 pb-28 pt-7">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-primary">
          <UserPlus className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Follow suggestions</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Follow the work.</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Hear a demo. See a piece. Then decide who belongs in your orbit.
        </p>
      </header>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search artists, styles, or mediums"
          className="w-full rounded-2xl bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              filter === item.id ? "gradient-warm text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {suggestions.isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : suggestions.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-card p-5 text-center">
          <p className="text-sm text-foreground">Artist previews could not load.</p>
          <button type="button" onClick={() => suggestions.refetch()} className="mt-3 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground">Try again</button>
        </div>
      ) : artists.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
          <UserPlus className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            {suggestions.data?.length ? "No artists match that search" : "The stage is ready for its first intro"}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {suggestions.data?.length
              ? "Try another style, tag, or category."
              : "Artists appear here after adding a demo track or artwork. Yours can be the first."}
          </p>
          {!suggestions.data?.length && (
            <button type="button" onClick={() => navigate("/profile?artist=studio")} className="mt-4 rounded-xl gradient-warm px-4 py-2.5 text-xs font-semibold text-primary-foreground">
              Add your artist intro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">{artists.length} {artists.length === 1 ? "artist" : "artists"} with work to preview</p>
          {artists.map((artist) => <ArtistSuggestionCard key={artist.id} artist={artist} />)}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FollowPage;
