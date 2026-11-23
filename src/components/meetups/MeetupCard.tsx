import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, ChevronUp, MapPin, Pencil, UsersRound, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useMeetupResponses,
  useRespondToMeetup,
  useSaveMeetup,
  useWithdrawFromMeetup,
  type Meetup,
  type RSVPStatus,
} from "@/hooks/use-meetups";

interface Props {
  meetup: Meetup;
  isHost: boolean;
  onEdit: (meetup: Meetup) => void;
}

const responseLabel: Record<RSVPStatus, string> = {
  going: "Going",
  interested: "Interested",
  waitlist: "Waitlisted",
};

const MeetupCard = ({ meetup, isHost, onEdit }: Props) => {
  const respond = useRespondToMeetup();
  const withdraw = useWithdrawFromMeetup();
  const save = useSaveMeetup();
  const [responsesOpen, setResponsesOpen] = useState(false);
  const responses = useMeetupResponses(meetup.id, isHost && responsesOpen);
  const isCancelled = meetup.status === "cancelled";
  const isFull = meetup.capacity !== null && meetup.going_count >= meetup.capacity;
  const busy = respond.isPending || withdraw.isPending || save.isPending;

  const sendResponse = async (status: "going" | "interested") => {
    try {
      const actual = await respond.mutateAsync({ meetupId: meetup.id, status });
      toast.success(actual === "waitlist" ? "This plan is full — you’re on the waitlist" : `Marked ${responseLabel[actual].toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your response");
    }
  };

  const removeResponse = async () => {
    try {
      await withdraw.mutateAsync(meetup.id);
      toast.success("Response withdrawn");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not withdraw");
    }
  };

  const toggleCancelled = async () => {
    if (!isCancelled && !window.confirm("Cancel this meetup for everyone?")) return;
    try {
      await save.mutateAsync({
        id: meetup.id,
        title: meetup.title,
        category: meetup.category,
        description: meetup.description,
        location_name: meetup.location_name,
        starts_at: meetup.starts_at,
        ends_at: meetup.ends_at,
        capacity: meetup.capacity,
        status: isCancelled ? "published" : "cancelled",
      });
      toast.success(isCancelled ? "Meetup reopened" : "Meetup cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update meetup");
    }
  };

  return (
    <article className={`rounded-3xl border border-border bg-card p-4 shadow-card ${isCancelled ? "opacity-70" : ""}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-foreground">{meetup.category}</span>
            {isCancelled && <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive">Cancelled</span>}
            {isHost && <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">Your plan</span>}
          </div>
          <h2 className="font-display text-xl font-bold leading-tight text-foreground">{meetup.title}</h2>
        </div>
        {isHost && (
          <button onClick={() => onEdit(meetup)} aria-label={`Edit ${meetup.title}`} className="shrink-0 rounded-xl bg-secondary p-2.5 text-muted-foreground transition-colors hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">{format(new Date(meetup.starts_at), "EEE, MMM d · h:mm a")}</p>
            {meetup.ends_at && <p className="text-xs">Until {format(new Date(meetup.ends_at), "h:mm a")}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /><span>{meetup.location_name}</span></div>
        <div className="flex items-center gap-2"><UsersRound className="h-4 w-4 shrink-0 text-primary" /><span>{meetup.going_count} going · {meetup.interested_count} interested{meetup.capacity !== null ? ` · ${meetup.capacity} guest ${meetup.capacity === 1 ? "spot" : "spots"}` : ""}</span></div>
      </div>

      {meetup.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{meetup.description}</p>}

      <p className="mt-3 text-xs text-muted-foreground">
        Hosted by {meetup.host_username ? <Link className="font-medium text-foreground underline decoration-border underline-offset-2" to={`/u/${meetup.host_username}`}>{meetup.host_name || `@${meetup.host_username}`}</Link> : meetup.host_name || "a Fumbler member"}
      </p>

      {isHost ? (
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setResponsesOpen((value) => !value)} className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground">
              Responses {responsesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button disabled={busy} onClick={toggleCancelled} className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
              <XCircle className="h-3.5 w-3.5" />{isCancelled ? "Reopen" : "Cancel plan"}
            </button>
          </div>
          {responsesOpen && (
            <div className="mt-3 rounded-2xl bg-secondary/60 p-3">
              {responses.isLoading ? <p className="text-xs text-muted-foreground">Loading responses…</p> : responses.error ? <p className="text-xs text-destructive">Could not load responses.</p> : responses.data?.length ? (
                <ul className="space-y-2">
                  {responses.data.map((response) => (
                    <li key={response.user_id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-foreground">{response.name}</span>
                      <span className="shrink-0 text-muted-foreground">{responseLabel[response.status]}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-muted-foreground">No responses yet.</p>}
            </div>
          )}
        </div>
      ) : !isCancelled ? (
        <div className="mt-4 border-t border-border pt-3">
          {meetup.viewer_status && (
            <div className="mb-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-primary">You’re {responseLabel[meetup.viewer_status].toLowerCase()}</span>
              <button disabled={busy} onClick={removeResponse} className="text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50">Withdraw</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={() => sendResponse("interested")} className={`rounded-xl px-3 py-2.5 text-xs font-semibold disabled:opacity-50 ${meetup.viewer_status === "interested" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              Interested
            </button>
            <button disabled={busy} onClick={() => sendResponse("going")} className={`rounded-xl px-3 py-2.5 text-xs font-semibold disabled:opacity-50 ${meetup.viewer_status === "going" ? "bg-primary text-primary-foreground" : "gradient-warm text-primary-foreground"}`}>
              {isFull && meetup.viewer_status !== "going" ? "Join waitlist" : "Going"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default MeetupCard;
