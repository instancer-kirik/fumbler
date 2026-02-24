import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    a: "No. fumbler doesn't run ads, sell data, or share your information with third parties. It's a weird little app built by one person who also uses it.",
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl bg-background max-h-[90vh] flex flex-col p-0"
      >
        <SheetHeader className="shrink-0 px-5 pt-6 pb-3">
          <SheetTitle className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Help &amp; Support
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Answers, contact, and ways to keep the lights on.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">

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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF5E5B]/10 group-hover:bg-[#FF5E5B]/20 transition-colors">
                <Coffee className="h-5 w-5 text-[#FF5E5B]" />
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00D54B]/10 group-hover:bg-[#00D54B]/20 transition-colors">
                <DollarSign className="h-5 w-5 text-[#00D54B]" />
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
