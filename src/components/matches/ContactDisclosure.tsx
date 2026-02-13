import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Globe, Instagram, Twitter, Link2, Eye, EyeOff, Share2, Check } from "lucide-react";
import { useMatchContactMethods, useUpdateMatch, type MatchRow } from "@/hooks/use-matches";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ContactDisclosureProps {
  match: MatchRow;
  otherProfileId: string;
  amUser1: boolean;
}

const CONTACT_ICONS: Record<string, typeof Phone> = {
  phone: Phone,
  email: Mail,
  instagram: Instagram,
  twitter: Twitter,
  website: Globe,
};

const ContactDisclosure = ({ match, otherProfileId, amUser1 }: ContactDisclosureProps) => {
  const { user } = useAuth();
  const { data: theirContacts } = useMatchContactMethods(otherProfileId);
  const { data: myContacts } = useMatchContactMethods(user?.id);
  const updateMatch = useUpdateMatch();
  const [showMyContacts, setShowMyContacts] = useState(false);

  const iShared = amUser1 ? match.contact_shared_by_user1 : match.contact_shared_by_user2;
  const theyShared = amUser1 ? match.contact_shared_by_user2 : match.contact_shared_by_user1;

  const toggleShare = () => {
    const field = amUser1 ? "contact_shared_by_user1" : "contact_shared_by_user2";
    updateMatch.mutate({
      matchId: match.id,
      updates: { [field]: !iShared },
    });
  };

  const contactEntries = theirContacts ? Object.entries(theirContacts).filter(([, v]) => v) : [];

  return (
    <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Contact Methods
        </h4>
        <button
          onClick={toggleShare}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
            iShared
              ? "gradient-warm text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-secondary"
          }`}
        >
          {iShared ? <Check className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {iShared ? "Shared" : "Share mine"}
        </button>
      </div>

      {/* Their contacts (only if they shared) */}
      {theyShared && contactEntries.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Their contacts</p>
          {contactEntries.map(([type, value]) => {
            const Icon = CONTACT_ICONS[type] || Link2;
            return (
              <div key={type} className="flex items-center gap-2 rounded-xl bg-card/60 px-3 py-2">
                <Icon className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                <span className="text-xs text-foreground truncate">{value}</span>
                <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0 capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      ) : theyShared ? (
        <p className="text-xs text-muted-foreground italic">They shared but haven't added contact methods yet.</p>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          They haven't shared their contacts yet.
          {!iShared && " Share yours first to encourage them."}
        </p>
      )}

      {/* My shared preview */}
      {iShared && (
        <div className="pt-2 border-t border-border/50">
          <button
            onClick={() => setShowMyContacts(!showMyContacts)}
            className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {showMyContacts ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showMyContacts ? "Hide" : "Preview"} what you're sharing
          </button>
          <AnimatePresence>
            {showMyContacts && myContacts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-1"
              >
                {Object.entries(myContacts).filter(([, v]) => v).length > 0 ? (
                  Object.entries(myContacts)
                    .filter(([, v]) => v)
                    .map(([type, value]) => {
                      const Icon = CONTACT_ICONS[type] || Link2;
                      return (
                        <div key={type} className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                          <Icon className="h-3.5 w-3.5 text-primary/40 flex-shrink-0" />
                          <span className="text-xs text-foreground/70 truncate">{value as string}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto capitalize">{type}</span>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No contact methods on your profile yet. Add them in your profile settings.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ContactDisclosure;
