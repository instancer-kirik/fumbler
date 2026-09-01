import { Coffee, MessageCircle } from "lucide-react";

interface Props {
  handle?: string;
  blurb?: string;
  className?: string;
}

/**
 * Lightweight stand-in for paid/private media: shows a Cash App handle and a
 * message prompt instead of a checkout flow.
 */
const SupportPrompt = ({
  handle = "$Instancer",
  blurb = "There's a private set I share one-to-one. No paywall, no checkout — send a tip on Cash App if it moves you, then message me and say what you'd like to see.",
  className = "",
}: Props) => {
  return (
    <div
      className={`rounded-2xl bg-card shadow-card p-5 space-y-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Coffee className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-display text-base font-bold text-foreground">
          Private set &amp; tips
        </h3>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{blurb}</p>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://cash.app/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-secondary px-3 py-1.5 font-mono text-xs font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary/70"
        >
          Cash App {handle} ↗
        </a>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
          Then message me here
        </span>
      </div>
    </div>
  );
};

export default SupportPrompt;
