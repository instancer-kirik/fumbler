import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  type Person,
  INTENTS,
  INTENT_LABELS,
  STATUSES,
  STATUS_LABELS,
  PRIORITIES,
  CHANNELS,
  INTERACTION_KINDS,
  useUpdatePerson,
  useDeletePerson,
  useInteractions,
  useLogInteraction,
} from "@/hooks/use-people";
import { Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";

const input =
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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-2 block">{label}</label>
    {children}
  </div>
);

interface Props {
  person: Person;
  onClose: () => void;
}

const PersonDetailSheet = ({ person, onClose }: Props) => {
  const update = useUpdatePerson();
  const remove = useDeletePerson();
  const { data: log = [] } = useInteractions(person.id);
  const logInteraction = useLogInteraction();

  const [notes, setNotes] = useState(person.notes || "");
  const [nextAction, setNextAction] = useState(person.next_action || "");
  const [due, setDue] = useState(person.next_action_due || "");
  const [contactValue, setContactValue] = useState(person.contact_value || "");
  const [entryKind, setEntryKind] = useState("note");
  const [entryNote, setEntryNote] = useState("");

  const set = (updates: Parameters<typeof update.mutate>[0]["updates"]) =>
    update.mutate({ id: person.id, updates });

  const toggleIntent = (i: string) =>
    set({
      intents: person.intents.includes(i)
        ? person.intents.filter((x) => x !== i)
        : [...person.intents, i],
    });

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-background max-h-[90vh] flex flex-col z-[70]">
        <SheetHeader className="shrink-0 text-left">
          <SheetTitle className="font-display text-lg">{person.display_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-3 space-y-5 pb-8 overflow-y-auto flex-1">
          {(person.handle || person.link_url) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {person.handle && <span>{person.handle}</span>}
              {person.link_url && (
                <a
                  href={person.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary"
                >
                  link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <Field label="Intent">
            <div className="flex flex-wrap gap-1.5">
              {INTENTS.map((i) => (
                <Chip key={i} active={person.intents.includes(i)} onClick={() => toggleIntent(i)}>
                  {INTENT_LABELS[i]}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Status">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <Chip key={s} active={person.status === s} onClick={() => set({ status: s })}>
                  {STATUS_LABELS[s]}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Priority">
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <Chip key={p} active={person.priority === p} onClick={() => set({ priority: p })}>
                  {p}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Next action">
            <input
              className={input}
              value={nextAction}
              placeholder="e.g. send the interview questions"
              onChange={(e) => setNextAction(e.target.value)}
              onBlur={() => set({ next_action: nextAction || null })}
            />
            <input
              type="date"
              className={`${input} mt-2`}
              value={due}
              onChange={(e) => {
                setDue(e.target.value);
                set({ next_action_due: e.target.value || null });
              }}
            />
          </Field>

          <Field label="Contact">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CHANNELS.map((c) => (
                <Chip
                  key={c}
                  active={person.contact_channel === c}
                  onClick={() => set({ contact_channel: person.contact_channel === c ? null : c })}
                >
                  {c}
                </Chip>
              ))}
            </div>
            <input
              className={input}
              value={contactValue}
              placeholder="handle, email, number…"
              onChange={(e) => setContactValue(e.target.value)}
              onBlur={() => set({ contact_value: contactValue || null })}
            />
          </Field>

          <Field label="Private notes">
            <textarea
              className={`${input} min-h-24 resize-y`}
              value={notes}
              placeholder="Only you can read this."
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => set({ notes: notes || null })}
            />
          </Field>

          {person.profile_id && (
            <button
              onClick={() => set({ reveal_to_person: !person.reveal_to_person })}
              className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border p-3 text-left"
            >
              {person.reveal_to_person ? (
                <Eye className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {person.reveal_to_person ? "They can see this entry" : "Private to you"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reveals the entry itself (intent, status) — never your notes log.
                </p>
              </div>
            </button>
          )}

          {/* Interaction log */}
          <Field label="Interaction log">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {INTERACTION_KINDS.map((k) => (
                <Chip key={k} active={entryKind === k} onClick={() => setEntryKind(k)}>
                  {k}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={input}
                value={entryNote}
                placeholder="What happened?"
                onChange={(e) => setEntryNote(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!entryNote.trim()) return;
                  logInteraction.mutate({ personId: person.id, kind: entryKind, note: entryNote.trim() });
                  setEntryNote("");
                }}
                className="rounded-2xl gradient-warm px-4 text-sm font-semibold text-primary-foreground shrink-0"
              >
                Log
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {log.length === 0 && (
                <p className="text-xs text-muted-foreground">No touches logged yet.</p>
              )}
              {log.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-card border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wide font-bold text-primary">
                      {entry.kind}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(entry.occurred_at).toLocaleDateString()}
                    </span>
                  </div>
                  {entry.note && <p className="text-sm text-foreground mt-1">{entry.note}</p>}
                </div>
              ))}
            </div>
          </Field>

          <button
            onClick={() => {
              remove.mutate(person.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3 text-sm font-semibold text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Remove from list
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PersonDetailSheet;
