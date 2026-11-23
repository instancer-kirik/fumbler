import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageCircle, Plus, Send } from "lucide-react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { HELP_REQUEST_CATEGORIES, helpChatMessageSchema, helpChatStartSchema } from "@/lib/help-request";
import { useLocation } from "react-router-dom";

interface HelpChatProps {
  onBack: () => void;
}

const categoryLabels = Object.fromEntries(
  HELP_REQUEST_CATEGORIES.map((category) => [category.value, category.label]),
);

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const HelpChat = ({ onBack }: HelpChatProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [startingNew, setStartingNew] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ["my-help-team-roles", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (roleError) throw roleError;
      return data;
    },
  });
  const isHelpTeam = roles.some((role) => role.role === "admin" || role.role === "moderator");

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["help-chat-requests", user?.id],
    enabled: Boolean(user),
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error: requestError } = await supabase
        .from("fumble_help_requests")
        .select("id, requester_id, category, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (requestError) throw requestError;
      return data;
    },
  });

  useEffect(() => {
    if (!startingNew && !activeRequestId && requests[0]) {
      setActiveRequestId(requests[0].id);
    }
  }, [activeRequestId, requests, startingNew]);

  const activeRequest = useMemo(
    () => requests.find((request) => request.id === activeRequestId) ?? null,
    [activeRequestId, requests],
  );

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["help-chat-messages", activeRequestId],
    enabled: Boolean(activeRequestId),
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error: messageError } = await supabase
        .from("fumble_help_messages")
        .select("id, request_id, author_id, body, created_at")
        .eq("request_id", activeRequestId!)
        .order("created_at", { ascending: true });
      if (messageError) throw messageError;
      return data;
    },
  });

  const hasTeamReply = Boolean(
    activeRequest && messages.some((message) => message.author_id !== activeRequest.requester_id),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeRequestId, messages.length]);

  const sendMessage = useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Sign in to start a private help chat.");

      if (startingNew || !activeRequestId) {
        if (isHelpTeam && requests.length > 0) {
          throw new Error("Choose a request from the help-team inbox to reply.");
        }
        const { data, error: createError } = await supabase
          .from("fumble_help_requests")
          .insert({
            requester_id: user.id,
            category: "other",
            message: body,
            page_path: location.pathname,
            allow_contact: true,
            status: "new",
          })
          .select("id")
          .single();
        if (createError) throw createError;
        return { requestId: data.id, isNew: true };
      }

      const { error: insertError } = await supabase
        .from("fumble_help_messages")
        .insert({
          request_id: activeRequestId,
          author_id: user.id,
          body,
        });
      if (insertError) throw insertError;

      if (isHelpTeam && activeRequest?.requester_id !== user.id) {
        await supabase
          .from("fumble_help_requests")
          .update({ status: "in_progress" })
          .eq("id", activeRequestId);
      }
      return { requestId: activeRequestId, isNew: false };
    },
    onSuccess: async ({ requestId, isNew }) => {
      setDraft("");
      setError(null);
      setStartingNew(false);
      setActiveRequestId(requestId);
      await queryClient.invalidateQueries({ queryKey: ["help-chat-requests", user?.id] });
      if (!isNew) {
        await queryClient.invalidateQueries({ queryKey: ["help-chat-messages", requestId] });
      }
    },
    onError: (cause) => {
      setError(cause instanceof Error ? cause.message : "Your message did not send. Please try again.");
    },
  });

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const schema = startingNew || !activeRequestId ? helpChatStartSchema : helpChatMessageSchema;
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Write a message first.");
      return;
    }
    sendMessage.mutate(parsed.data);
  };

  const startNewChat = () => {
    setStartingNew(true);
    setActiveRequestId(null);
    setDraft("");
    setError(null);
  };

  return (
    <>
      <SheetHeader className="shrink-0 px-5 pb-3 pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Help and Support"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-card transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <SheetTitle className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <MessageCircle className="h-5 w-5 text-primary" />
              {isHelpTeam ? "Help-team chat" : "Chat with the help team"}
            </SheetTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Private messages, saved for when you come back.
            </p>
          </div>
        </div>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-6">
        {!user ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">
            Sign in to start a private help-team conversation.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <select
                aria-label={isHelpTeam ? "Help-team request inbox" : "Your help conversations"}
                value={startingNew ? "new" : activeRequestId ?? ""}
                onChange={(event) => {
                  if (event.target.value === "new") {
                    startNewChat();
                  } else {
                    setStartingNew(false);
                    setActiveRequestId(event.target.value);
                    setError(null);
                  }
                }}
                className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {requests.length === 0 && <option value="new">New conversation</option>}
                {startingNew && requests.length > 0 && <option value="new">New conversation</option>}
                {requests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {categoryLabels[request.category] ?? "Help request"} · {formatTime(request.created_at)}
                    {isHelpTeam ? ` · ${request.status.replace("_", " ")}` : ""}
                  </option>
                ))}
              </select>
              {!isHelpTeam && requests.length > 0 && (
                <button
                  type="button"
                  onClick={startNewChat}
                  aria-label="Start a new help conversation"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="min-h-[220px] flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card/50 p-3">
              {requestsLoading || (activeRequestId && messagesLoading) ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : activeRequest ? (
                <>
                  <ChatBubble
                    body={activeRequest.message}
                    createdAt={activeRequest.created_at}
                    mine={activeRequest.requester_id === user.id}
                    label={activeRequest.requester_id === user.id ? "You" : "Requester"}
                  />
                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      body={message.body}
                      createdAt={message.created_at}
                      mine={message.author_id === user.id}
                      label={
                        message.author_id === user.id
                          ? "You"
                          : message.author_id === activeRequest.requester_id
                            ? "Requester"
                            : "Help team"
                      }
                    />
                  ))}
                  {!hasTeamReply && activeRequest.requester_id === user.id && (
                    <p className="rounded-xl bg-secondary/70 p-3 text-center text-xs leading-relaxed text-muted-foreground">
                      Waiting for the help team. Your messages are saved, so you can leave and come back later.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center px-5 text-center">
                  <MessageCircle className="mb-3 h-7 w-7 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Start a private conversation</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Leave your first message below. The help team can reply here when they review it—this is not a live-agent chat.
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="mt-3 space-y-2">
              <label htmlFor="help-chat-message" className="sr-only">
                Message the help team
              </label>
              <Textarea
                id="help-chat-message"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (error) setError(null);
                }}
                rows={3}
                maxLength={2000}
                placeholder={isHelpTeam ? "Write a help-team reply…" : "Write your message…"}
                className="resize-none rounded-xl"
              />
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={sendMessage.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-warm py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sendMessage.isPending ? "Sending…" : isHelpTeam ? "Send reply" : "Send message"}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
};

interface ChatBubbleProps {
  body: string;
  createdAt: string;
  mine: boolean;
  label: string;
}

const ChatBubble = ({ body, createdAt, mine, label }: ChatBubbleProps) => (
  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
      <p className="text-[10px] font-semibold opacity-75">{label} · {formatTime(createdAt)}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{body}</p>
    </div>
  </div>
);

export default HelpChat;
