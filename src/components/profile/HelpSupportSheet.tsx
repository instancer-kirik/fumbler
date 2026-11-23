import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Mail,
  Coffee,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Key,
  Zap,
  LifeBuoy,
  Send,
  CheckCircle2,
  Loader2,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  HELP_REQUEST_CATEGORIES,
  helpRequestSchema,
  type HelpRequestInput,
} from "@/lib/help-request";
import { HELP_TEAM_PHONE } from "@/lib/support-contact";
import { telHref } from "@/lib/phone";

interface HelpSupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqs = [
  {
    q: "What even is fumbler?",
    a: "A compendium of what works on you. It started as a personal project to articulate preferences, set expectations, and make connections a little less chaotic. Think of it as sharing your context before you fumble into something.",
    icon: Sparkles,
  },
  {
    q: "Who can see my resonance profile?",
    a: "By default, only users in Discover can see sections you've marked as visible. You control visibility per-section. Share links let you grant specific people elevated access — no account needed on their end.",
    icon: Heart,
  },
  {
    q: "What are share links?",
    a: "Share links let someone view more of your resonance profile than the public default — useful for sending ahead of a date or meetup. You can set them to expire and revoke them anytime from the Share Links section.",
    icon: Key,
  },
  {
    q: "What's the variety invoicing thing?",
    a: "A consensual way to handle dynamics around treating, paying, or gifting — with explicit opt-in on both sides. It's disabled by default and only activates if both people turn it on. Still experimental.",
    icon: Zap,
  },
  {
    q: "Is my data sold or shared?",
    a: "No. fumbler doesn't run ads, sell data, or share your information with third parties.",
    icon: HelpCircle,
  },
];

const FaqItem = ({
  faq,
  index,
}: {
  faq: (typeof faqs)[number];
  index: number;
}) => {
  const [open, setOpen] = useState(false);
  const Icon = faq.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl bg-card shadow-card overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground leading-snug">
          {faq.q}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-11">
            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const HelpSupportSheet = ({ open, onOpenChange }: HelpSupportSheetProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [category, setCategory] = useState<HelpRequestInput["category"]>("technical");
  const [message, setMessage] = useState("");
  const [allowContact, setAllowContact] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactHref = [
    "mailto:kirik@instance.select",
    "?subject=",
    encodeURIComponent("fumbler feedback"),
    "&body=",
    encodeURIComponent("Hey,\n\n"),
  ].join("");

  const handleAbout = () => {
    onOpenChange(false);
    setTimeout(() => navigate("/about"), 150);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = helpRequestSchema.safeParse({
      category,
      message,
      pagePath: location.pathname,
      allowContact,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Check the request and try again.");
      return;
    }
    if (!user) {
      setError("Sign in so the help team can connect this request to your account.");
      return;
    }

    setSubmitting(true);
    const { error: saveError } = await supabase
      .from("fumble_help_requests")
      .insert({
        requester_id: user.id,
        category: parsed.data.category,
        message: parsed.data.message,
        page_path: parsed.data.pagePath,
        allow_contact: parsed.data.allowContact,
        status: "new",
      });
    setSubmitting(false);

    if (saveError) {
      setError("The request didn’t save. Please try again or use the email option below.");
      return;
    }

    setMessage("");
    setSubmitted(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[70] rounded-t-3xl bg-background max-h-[90vh] flex flex-col p-0"
      >
        <SheetHeader className="shrink-0 px-5 pt-6 pb-3">
          <SheetTitle className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Help &amp; Support
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Answers, a private help-team inbox, and ways to keep the lights on.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-card p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <LifeBuoy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Ah heck. We’re fumbling this.
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Tell the help team what went unrealistically sideways. Your note is private.
                  This does not start a live call or contact emergency services.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="mt-4 rounded-xl bg-secondary p-4 text-center" role="status">
                <CheckCircle2 className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">Your note is in the help inbox.</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  The team can review it and use your account email if you allowed contact.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="help-category" className="mb-1.5 block text-xs font-semibold text-foreground">
                    What kind of fumble is it?
                  </label>
                  <select
                    id="help-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as HelpRequestInput["category"])}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {HELP_REQUEST_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="help-message" className="mb-1.5 block text-xs font-semibold text-foreground">
                    What happened?
                  </label>
                  <Textarea
                    id="help-message"
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      if (error) setError(null);
                    }}
                    maxLength={2000}
                    rows={4}
                    placeholder="What you tried, what happened, and what you expected…"
                    className="resize-none rounded-xl"
                  />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{message.length}/2,000</p>
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={allowContact}
                    onChange={(event) => setAllowContact(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  The help team may contact me at my account email about this request.
                </label>

                {category === "safety" && (
                  <p className="rounded-xl bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
                    If anyone is in immediate danger, contact local emergency services. This inbox is not an emergency line.
                  </p>
                )}

                {error && <p role="alert" className="text-xs leading-relaxed text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl gradient-warm py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "Saving your request…" : "Send to the help team"}
                </button>
              </form>
            )}
          </motion.section>

          {/* FAQ */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Frequently asked
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <FaqItem key={faq.q} faq={faq} index={i} />
              ))}
            </div>
          </motion.section>

          {/* Contact */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Get in touch
            </h2>
            <a
              href={contactHref}
              className="flex items-center gap-4 rounded-2xl bg-card shadow-card p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Send feedback or report an issue</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">kirik@instance.select</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">↗</span>
            </a>
          </motion.section>

          {/* Call the help team */}
          {telHref(HELP_TEAM_PHONE) && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="space-y-2"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                Reach the help team
              </h2>
              <a
                href={telHref(HELP_TEAM_PHONE) ?? undefined}
                className="flex items-center gap-4 rounded-2xl bg-card shadow-card p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Call the help team</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{HELP_TEAM_PHONE}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">tap to dial</span>
              </a>
            </motion.section>
          )}

          {/* Support the dev */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Support the developer
            </h2>

            <a
              href="https://ko-fi.com/YOUR_KOFI_HANDLE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-card shadow-card p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Coffee className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Buy me a coffee</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ko-fi — one-time or recurring</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">ko-fi.com ↗</span>
            </a>

            <a
              href="https://cash.app/$Instancer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-card shadow-card p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Cash App</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">$Instancer</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">cash.app ↗</span>
            </a>

            <button
              onClick={handleAbout}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Read more on the About page
            </button>
          </motion.section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HelpSupportSheet;
