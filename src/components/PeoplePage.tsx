import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, AlertCircle } from "lucide-react";
import {
  usePeople,
  useCreatePerson,
  INTENTS,
  INTENT_LABELS,
  STATUS_LABELS,
  type Person,
} from "@/hooks/use-people";
import PersonDetailSheet from "@/components/people/PersonDetailSheet";

const inputClass =
  "w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all";

const priorityDot: Record<string, string> = {
  high: "bg-primary",
  medium: "bg-muted-foreground",
  low: "bg-border",
};

const PeoplePage = () => {
  const { data: people = [], isLoading } = usePeople();
  const create = useCreatePerson();
  const [query, setQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [active, setActive] = useState<Person | null>(null);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [link, setLink] = useState("");
  const [newIntents, setNewIntents] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      people.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          p.display_name.toLowerCase().includes(q) ||
          (p.handle || "").toLowerCase().includes(q) ||
          (p.notes || "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q));
        const matchI = !intentFilter || p.intents.includes(intentFilter);
        return matchQ && matchI;
      }),
    [people, query, intentFilter]
  );

  const overdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return people.filter((p) => p.next_action_due && p.next_action_due <= today && p.status !== "done" && p.status !== "passed");
  }, [people]);

  const submit = () => {
    if (!name.trim()) return;
    create.mutate(
      {
        display_name: name.trim(),
        handle: handle.trim() || null,
        link_url: link.trim() || null,
        intents: newIntents,
      },
      {
        onSuccess: () => {
          setName("");
          setHandle("");
          setLink("");
          setNewIntents([]);
          setComposing(false);
        },
      }
    );
  };

  const toggleNewIntent = (i: string) =>
    setNewIntents((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <div className="min-h-screen bg-background pb-24 pt-6">
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl font-bold text-foreground">People</h1>
          <button
            onClick={() => setComposing((c) => !c)}
            className="rounded-xl gradient-warm p-2"
            aria-label={composing ? "Close" : "Add person"}
          >
            {composing ? (
              <X className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Plus className="h-4 w-4 text-primary-foreground" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your private list — people to talk to, interview, pitch, or date. Only you can see it.
        </p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names, handles, notes..."
            className="w-full rounded-xl bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setIntentFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !intentFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            All
          </button>
          {INTENTS.map((i) => (
            <button
              key={i}
              onClick={() => setIntentFilter(intentFilter === i ? null : i)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                intentFilter === i ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {INTENT_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3 mb-4">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={100} />
              <input className={inputClass} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle (optional)" maxLength={100} />
              <input className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link — profile, site, socials (optional)" maxLength={500} />
              <div className="flex flex-wrap gap-1.5">
                {INTENTS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleNewIntent(i)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      newIntents.includes(i) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {INTENT_LABELS[i]}
                  </button>
                ))}
              </div>
              <button
                onClick={submit}
                disabled={!name.trim() || create.isPending}
                className="w-full rounded-2xl gradient-warm py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {create.isPending ? "Adding..." : "Add to list"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue nudges */}
      {overdue.length > 0 && (
        <div className="px-4 mb-4 space-y-2">
          {overdue.slice(0, 3).map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              className="w-full flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 p-3 text-left"
            >
              <AlertCircle className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-semibold">{p.display_name}</span> — {p.next_action || "follow up"} (due{" "}
                {p.next_action_due})
              </p>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-muted-foreground text-sm">Loading your list...</div>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="px-8 py-16 text-center">
          <p className="font-display text-lg text-foreground mb-1">Nobody here yet</p>
          <p className="text-sm text-muted-foreground">
            Add anyone — on Fumbler or not — and tag why you want to reach them.
          </p>
        </div>
      )}

      <div className="px-4 space-y-2">
        {filtered.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            onClick={() => setActive(p)}
            className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border p-3 text-left"
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${priorityDot[p.priority] || "bg-border"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-semibold text-foreground text-sm truncate">{p.display_name}</p>
                {p.handle && <span className="text-[10px] text-muted-foreground truncate">{p.handle}</span>}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {p.intents.map((t) => (
                  <span key={t} className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {INTENT_LABELS[t as keyof typeof INTENT_LABELS] || t}
                  </span>
                ))}
              </div>
              {p.next_action && (
                <p className="text-xs text-muted-foreground mt-1 truncate">Next: {p.next_action}</p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {STATUS_LABELS[p.status as keyof typeof STATUS_LABELS] || p.status}
            </span>
          </motion.button>
        ))}
      </div>

      {active && (
        <PersonDetailSheet
          person={people.find((p) => p.id === active.id) || active}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
};

export default PeoplePage;
