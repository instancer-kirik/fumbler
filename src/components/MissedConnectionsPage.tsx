import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Plus, Heart, MessageCircle, X, Search, Trash2, User, ChevronDown, ChevronUp, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  useMissedConnections,
  useCreateMissedConnection,
  useDeleteMissedConnection,
  useToggleReaction,
  type MCCategory,
} from "@/hooks/use-missed-connections";

const CATEGORIES: { value: MCCategory | "all"; label: string; short: string }[] = [
  { value: "all", label: "✨ All", short: "All" },
  { value: "romantic", label: "💛 Romantic", short: "Romantic" },
  { value: "friendly", label: "🤝 Friendly", short: "Friendly" },
  { value: "platonic", label: "🫂 Platonic", short: "Platonic" },
  { value: "funny", label: "😂 Funny", short: "Funny" },
  { value: "collab", label: "🛠️ Collab", short: "Collab" },
  { value: "lost_found", label: "🧭 Lost & Found", short: "Lost/Found" },
];

const categoryColors: Record<MCCategory, string> = {
  romantic: "bg-accent/15 text-accent",
  friendly: "bg-primary/15 text-primary-foreground",
  platonic: "bg-secondary text-secondary-foreground",
  funny: "bg-secondary text-secondary-foreground",
  collab: "bg-primary/20 text-primary-foreground",
  lost_found: "bg-accent/20 text-accent",
};

const categoryLabel = (c: MCCategory) => CATEGORIES.find((x) => x.value === c)?.label ?? c;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const MissedConnectionsPage = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<MCCategory | "all">("all");
  const [cityFilter, setCityFilter] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});

  const { data: rows = [], isLoading } = useMissedConnections({ category: filter, city: cityFilter });
  const createMut = useCreateMissedConnection();
  const deleteMut = useDeleteMissedConnection();
  const reactMut = useToggleReaction();

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-4">
      {/* Filters */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              filter === cat.value
                ? "gradient-warm text-primary-foreground shadow-card"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* City filter */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-secondary/40 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="Filter by city..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {cityFilter && (
          <button onClick={() => setCityFilter("")} className="text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Post button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          if (!user) {
            toast.error("Sign in to post a Missed Connection");
            return;
          }
          setComposeOpen((v) => !v);
        }}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 font-semibold text-foreground transition-colors hover:bg-primary/10"
      >
        <Plus className="h-5 w-5" />
        <span>{composeOpen ? "Close" : "Post a Missed Connection"}</span>
      </motion.button>

      <AnimatePresence>
        {composeOpen && user && (
          <ComposeForm
            onCancel={() => setComposeOpen(false)}
            onSubmit={async (values) => {
              try {
                await createMut.mutateAsync(values);
                toast.success("Posted! Fingers crossed 🤞");
                setComposeOpen(false);
              } catch (e: any) {
                toast.error(e.message || "Failed to post");
              }
            }}
            submitting={createMut.isPending}
          />
        )}
      </AnimatePresence>

      {/* Feed */}
      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-card p-6 text-center shadow-card">
          <p className="mb-1 font-display text-base font-bold text-foreground">No missed connections yet</p>
          <p className="text-xs text-muted-foreground">Be the first to post one — someone might be looking for you too.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {rows.map((row, i) => {
              const p = row.post;
              const isMine = user?.id === p.author_id;
              const relateActive = row.myReactions.includes("relate");
              const claimActive = row.myReactions.includes("thats_me");
              const claimsOpen = !!expandedClaims[p.id];

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="rounded-2xl bg-card p-5 shadow-card"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-foreground">{p.title}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[p.category]}`}>
                      {categoryLabel(p.category)}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.location_text}
                      {p.city && <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">{p.city}</span>}
                    </span>
                    {p.encounter_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.encounter_time}
                      </span>
                    )}
                  </div>

                  <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{p.description}</p>

                  {p.looking_for && (
                    <p className="mb-4 text-xs italic text-muted-foreground">"{p.looking_for}"</p>
                  )}

                  {/* author + time */}
                  <div className="mb-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {p.is_anonymous ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span className="italic">posted anonymously</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        <span>{p.author?.username ? `@${p.author.username}` : "anonymous"}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{timeAgo(p.created_at)}</span>
                    {isMine && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">your post</span>}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        disabled={!user || isMine || reactMut.isPending}
                        onClick={() =>
                          reactMut.mutate({
                            missed_connection_id: p.id,
                            kind: "relate",
                            active: relateActive,
                          })
                        }
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          relateActive
                            ? "gradient-warm text-primary-foreground shadow-card"
                            : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                        } disabled:opacity-40`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${relateActive ? "fill-current" : ""}`} />
                        Relate {row.relateCount > 0 && <span className="ml-0.5">· {row.relateCount}</span>}
                      </button>

                      {!isMine && (
                        <button
                          disabled={!user || reactMut.isPending}
                          onClick={() =>
                            reactMut.mutate({
                              missed_connection_id: p.id,
                              kind: "thats_me",
                              active: claimActive,
                            })
                          }
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            claimActive
                              ? "bg-accent text-accent-foreground shadow-card"
                              : "gradient-warm text-primary-foreground shadow-card"
                          } disabled:opacity-40`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {claimActive ? "You claimed" : "That's me!"}
                        </button>
                      )}
                    </div>

                    {isMine && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this missed connection?")) return;
                          try {
                            await deleteMut.mutateAsync(p.id);
                            toast.success("Deleted");
                          } catch (e: any) {
                            toast.error(e.message || "Failed to delete");
                          }
                        }}
                        className="rounded-full bg-secondary p-1.5 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Claimants (author only) */}
                  {isMine && row.claimCount > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <button
                        onClick={() => setExpandedClaims((s) => ({ ...s, [p.id]: !s[p.id] }))}
                        className="flex w-full items-center justify-between text-xs font-semibold text-foreground"
                      >
                        <span>🎯 {row.claimCount} {row.claimCount === 1 ? "person claims" : "people claim"} it's them</span>
                        {claimsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      {claimsOpen && (
                        <div className="mt-2 space-y-1.5">
                          {row.claimants?.map((c) => (
                            <div key={c.user_id} className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-foreground">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-muted-foreground">user {c.user_id.slice(0, 8)}</span>
                                <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                              </div>
                              {c.note && <p className="mt-1 italic text-muted-foreground">"{c.note}"</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ---------- Compose ----------

interface ComposeValues {
  category: MCCategory;
  title: string;
  location_text: string;
  city?: string;
  encounter_time?: string;
  description: string;
  looking_for?: string;
}

const ComposeForm = ({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (v: ComposeValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) => {
  const [values, setValues] = useState<ComposeValues>({
    category: "romantic",
    title: "",
    location_text: "",
    city: "",
    encounter_time: "",
    description: "",
    looking_for: "",
  });

  const set = <K extends keyof ComposeValues>(k: K, v: ComposeValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const canSubmit = useMemo(
    () => values.title.trim() && values.location_text.trim() && values.description.trim() && !submitting,
    [values, submitting]
  );

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(values);
      }}
      className="mb-5 space-y-3 overflow-hidden rounded-2xl bg-card p-4 shadow-card"
    >
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => set("category", c.value as MCCategory)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              values.category === c.value
                ? "gradient-warm text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <input
        maxLength={120}
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Title — 'Coffee shop eye contact ☕'"
        className="w-full rounded-xl bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          maxLength={200}
          value={values.location_text}
          onChange={(e) => set("location_text", e.target.value)}
          placeholder="Where — 'Blue Bottle, 3rd & Main'"
          className="rounded-xl bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <input
          maxLength={80}
          value={values.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="City (optional)"
          className="rounded-xl bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <input
        maxLength={120}
        value={values.encounter_time}
        onChange={(e) => set("encounter_time", e.target.value)}
        placeholder="When (optional) — 'Tuesday morning ~9am'"
        className="w-full rounded-xl bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />

      <textarea
        maxLength={2000}
        rows={4}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="What happened? Set the scene, describe them, describe you..."
        className="w-full resize-none rounded-xl bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />

      <input
        maxLength={500}
        value={values.looking_for}
        onChange={(e) => set("looking_for", e.target.value)}
        placeholder="Recognition tag (optional) — 'You: green jacket. Me: spilled latte.'"
        className="w-full rounded-xl bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl gradient-warm px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </motion.form>
  );
};

export default MissedConnectionsPage;
