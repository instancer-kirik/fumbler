import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  Check,
  Key,
  Clock,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useShareKeys, ShareKeyGrant, ShareKey } from "@/hooks/use-share-keys";
import { toast } from "sonner";

interface ShareKeysSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string | null | undefined;
}

const GRANT_OPTIONS: { value: ShareKeyGrant; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "matches",
    label: "Match access",
    description: "Viewer sees everything a match would see",
    icon: Users,
  },
  {
    value: "express",
    label: "Full access",
    description: "Viewer sees your complete resonance profile",
    icon: Zap,
  },
];

const EXPIRY_OPTIONS: { label: string; value: string | null }[] = [
  { label: "Never expires", value: null },
  { label: "24 hours", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

function expiryToIso(value: string | null): string | null {
  if (!value) return null;
  const now = new Date();
  const h = parseInt(value);
  if (value.endsWith("h")) {
    now.setHours(now.getHours() + h);
  } else if (value.endsWith("d")) {
    now.setDate(now.getDate() + parseInt(value));
  }
  return now.toISOString();
}

function formatExpiry(isoString: string | null): string {
  if (!isoString) return "Never";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const diffH = Math.floor(diffMs / 1000 / 60 / 60);
  if (diffH < 24) return `${diffH}h left`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d left`;
}

function formatUseCount(n: number): string {
  if (n === 0) return "Not used yet";
  if (n === 1) return "Used 1 time";
  return `Used ${n} times`;
}

const GrantBadge = ({ grants }: { grants: ShareKeyGrant }) => {
  const opt = GRANT_OPTIONS.find((o) => o.value === grants)!;
  const Icon = opt.icon;
  return (
    <span className={[
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
      grants === "express"
        ? "bg-primary/20 text-primary"
        : "bg-secondary text-muted-foreground",
    ].join(" ")}>
      <Icon className="h-2.5 w-2.5" />
      {opt.label}
    </span>
  );
};

const ShareKeyCard = ({
  shareKey,
  url,
  expired,
  onRevoke,
}: {
  shareKey: ShareKey;
  url: string;
  expired: boolean;
  onRevoke: (id: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleRevoke = () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      setTimeout(() => setConfirmRevoke(false), 3000);
      return;
    }
    onRevoke(shareKey.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={[
        "rounded-2xl border p-4 space-y-3 transition-colors",
        expired
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-card",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">
              {shareKey.label || "Untitled link"}
            </span>
            <GrantBadge grants={shareKey.grants} />
            {expired && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-destructive/20 text-destructive">
                <AlertTriangle className="h-2.5 w-2.5" />
                Expired
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatExpiry(shareKey.expires_at)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatUseCount(shareKey.use_count)}
            </span>
          </div>
        </div>

        <button
          onClick={handleRevoke}
          className={[
            "shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
            confirmRevoke
              ? "bg-destructive text-destructive-foreground"
              : "bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          ].join(" ")}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirmRevoke ? "Confirm" : "Revoke"}
        </button>
      </div>

      {!expired && (
        <button
          onClick={handleCopy}
          className="flex w-full items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
        >
          <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate text-xs text-muted-foreground font-mono">{url}</span>
          <span className="shrink-0 ml-2">
            {copied
              ? <Check className="h-3.5 w-3.5 text-primary" />
              : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </span>
        </button>
      )}
    </motion.div>
  );
};

const CreateKeyForm = ({
  onCreate,
  creating,
  onCancel,
}: {
  onCreate: (label: string, grants: ShareKeyGrant, expiry: string | null) => void;
  creating: boolean;
  onCancel: () => void;
}) => {
  const [label, setLabel] = useState("");
  const [grants, setGrants] = useState<ShareKeyGrant>("matches");
  const [expiry, setExpiry] = useState<string | null>(null);

  const handleCreate = () => {
    onCreate(label, grants, expiry);
  };

  const inputClass =
    "w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-2xl border border-primary/30 bg-card p-4 space-y-4"
    >
      <h3 className="font-display text-sm font-semibold text-foreground">New share link</h3>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Label (optional)</label>
        <input
          className={inputClass}
          placeholder="e.g. For Alex, Event night, ..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={60}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Access level</label>
        <div className="grid grid-cols-2 gap-2">
          {GRANT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = grants === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setGrants(opt.value)}
                className={[
                  "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary hover:border-primary/40",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Expires</label>
        <div className="flex flex-wrap gap-2">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setExpiry(opt.value)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                expiry === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/40",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-secondary py-3 text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl gradient-warm py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {creating ? (
            <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
          ) : (
            <>
              <Key className="h-4 w-4" />
              Create link
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const ShareKeysSheet = ({ open, onOpenChange, username }: ShareKeysSheetProps) => {
  const { keys, loading, creating, createKey, revokeKey, shareUrl, isExpired } =
    useShareKeys(username);
  const [showForm, setShowForm] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const activeKeys = keys.filter((k) => !isExpired(k));
  const expiredKeys = keys.filter((k) => isExpired(k));

  const handleCreate = async (label: string, grants: ShareKeyGrant, expiry: string | null) => {
    const created = await createKey({
      label,
      grants,
      expires_at: expiryToIso(expiry),
    });
    if (created) {
      setShowForm(false);
      // Auto-copy the new link
      const url = shareUrl(created);
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success("New link created & copied!");
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl bg-background max-h-[90vh] flex flex-col p-0"
      >
        <SheetHeader className="shrink-0 px-5 pt-6 pb-3">
          <SheetTitle className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Share links
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create links that grant someone elevated access to your resonance profile — no account needed.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-3">
          <AnimatePresence mode="wait">
            {showForm ? (
              <CreateKeyForm
                key="form"
                onCreate={handleCreate}
                creating={creating}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New share link
              </motion.button>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {activeKeys.length === 0 && !showForm && (
                <div className="rounded-2xl bg-secondary/50 p-6 text-center space-y-1">
                  <Link2 className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground">No active links</p>
                  <p className="text-xs text-muted-foreground">
                    Create a share link to let someone view more of your resonance profile.
                  </p>
                </div>
              )}

              <AnimatePresence>
                {activeKeys.map((k) => (
                  <ShareKeyCard
                    key={k.id}
                    shareKey={k}
                    url={shareUrl(k)}
                    expired={false}
                    onRevoke={revokeKey}
                  />
                ))}
              </AnimatePresence>

              {expiredKeys.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowExpired((v) => !v)}
                    className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    {showExpired
                      ? <ChevronUp className="h-3.5 w-3.5" />
                      : <ChevronDown className="h-3.5 w-3.5" />}
                    {expiredKeys.length} expired {expiredKeys.length === 1 ? "link" : "links"}
                  </button>

                  <AnimatePresence>
                    {showExpired && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3 mt-2"
                      >
                        {expiredKeys.map((k) => (
                          <ShareKeyCard
                            key={k.id}
                            shareKey={k}
                            url={shareUrl(k)}
                            expired={true}
                            onRevoke={revokeKey}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareKeysSheet;
