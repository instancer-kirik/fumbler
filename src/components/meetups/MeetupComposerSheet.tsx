import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSaveMeetup, type Meetup } from "@/hooks/use-meetups";

export const MEETUP_CATEGORIES = [
  "Activity",
  "Outdoors",
  "Food & drink",
  "Arts & music",
  "Making",
  "Games",
  "Learning",
  "Other",
];

const toLocalInput = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");
const defaultStart = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetup: Meetup | null;
}

const MeetupComposerSheet = ({ open, onOpenChange, meetup }: Props) => {
  const save = useSaveMeetup();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(MEETUP_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInput(defaultStart()));
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(meetup?.title || "");
    setCategory(meetup?.category || MEETUP_CATEGORIES[0]);
    setDescription(meetup?.description || "");
    setLocation(meetup?.location_name || "");
    setStartsAt(meetup ? toLocalInput(new Date(meetup.starts_at)) : toLocalInput(defaultStart()));
    setEndsAt(meetup?.ends_at ? toLocalInput(new Date(meetup.ends_at)) : "");
    setCapacity(meetup?.capacity?.toString() || "");
  }, [open, meetup]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;
    const guestLimit = capacity ? Number(capacity) : null;
    if (Number.isNaN(start.getTime()) || (!meetup && start <= new Date())) {
      toast.error("Choose a future start time");
      return;
    }
    if (end && (Number.isNaN(end.getTime()) || end <= start)) {
      toast.error("End time must be after the start");
      return;
    }
    if (guestLimit !== null && (!Number.isInteger(guestLimit) || guestLimit < 1 || guestLimit > 100)) {
      toast.error("Guest limit must be between 1 and 100");
      return;
    }
    try {
      await save.mutateAsync({
        id: meetup?.id,
        title: title.trim(),
        category,
        description: description.trim(),
        location_name: location.trim(),
        starts_at: start.toISOString(),
        ends_at: end?.toISOString() || null,
        capacity: guestLimit,
        status: meetup?.status || "published",
      });
      toast.success(meetup ? "Meetup updated" : "Meetup published");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save meetup");
    }
  };

  const inputClass =
    "w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex max-h-[92vh] max-w-lg flex-col rounded-t-3xl bg-background">
        <SheetHeader className="shrink-0 text-left">
          <SheetTitle className="font-display">{meetup ? "Edit meetup" : "Host a platonic meetup"}</SheetTitle>
          <SheetDescription>Make a specific, low-pressure plan around something you’d like to do.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-4 flex-1 space-y-4 overflow-y-auto pb-6">
          <div>
            <label htmlFor="meetup-title" className="mb-1.5 block text-xs font-medium text-muted-foreground">What are we doing?</label>
            <input id="meetup-title" required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sketch crawl, repair afternoon, band jam…" className={inputClass} />
          </div>
          <div>
            <label htmlFor="meetup-category" className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
            <select id="meetup-category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
              {MEETUP_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="meetup-description" className="mb-1.5 block text-xs font-medium text-muted-foreground">Useful details</label>
            <textarea id="meetup-description" rows={4} maxLength={1200} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Skill level, what to bring, accessibility, cost, and the general vibe…" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label htmlFor="meetup-location" className="mb-1.5 block text-xs font-medium text-muted-foreground">General location</label>
            <input id="meetup-location" required minLength={2} maxLength={160} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="East Austin, Riverside Park, or online" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="meetup-start" className="mb-1.5 block text-xs font-medium text-muted-foreground">Starts</label>
              <input id="meetup-start" type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="meetup-end" className="mb-1.5 block text-xs font-medium text-muted-foreground">Ends <span className="font-normal">(optional)</span></label>
              <input id="meetup-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="meetup-capacity" className="mb-1.5 block text-xs font-medium text-muted-foreground">Guest spots <span className="font-normal">(optional, not counting you)</span></label>
            <input id="meetup-capacity" type="number" min={1} max={100} value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="Leave blank for no set limit" className={inputClass} />
            <p className="mt-1.5 text-[11px] text-muted-foreground">When full, new “going” responses join the waitlist automatically.</p>
          </div>
          <button type="submit" disabled={save.isPending} className="gradient-warm w-full rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {save.isPending ? "Saving…" : meetup ? "Save changes" : "Publish meetup"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default MeetupComposerSheet;
