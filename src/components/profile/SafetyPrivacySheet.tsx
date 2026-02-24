import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Eye,
  EyeOff,
  Ban,
  Download,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SafetyPrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discoverable?: boolean;
  onDiscoverableChange?: (val: boolean) => void;
}

const SafetyPrivacySheet = ({
  open,
  onOpenChange,
  discoverable = true,
  onDiscoverableChange,
}: SafetyPrivacySheetProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDiscoverable, setIsDiscoverable] = useState(discoverable);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleVisibilityToggle = async () => {
    if (!user) return;
    const next = !isDiscoverable;
    setSavingVisibility(true);
    const { error } = await supabase
      .from("profiles")
      .update({ discoverable: next } as any)
      .eq("id", user.id);
    setSavingVisibility(false);
    if (!error) {
      setIsDiscoverable(next);
      onDiscoverableChange?.(next);
      toast.success(next ? "You're visible in Discover" : "You're hidden from Discover");
    } else {
      toast.error("Couldn't update visibility");
    }
  };

  const handleExportData = () => {
    toast.info("Data export coming soon — hang tight.");
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    if (!user) return;
    setDeleting(true);
    // Soft delete: clear profile data and sign out
    await supabase
      .from("profiles")
      .update({
        full_name: null,
        username: null,
        bio: null,
        avatar_url: null,
        onboarding_complete: false,
      } as any)
      .eq("id", user.id);
    await signOut();
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl bg-background max-h-[90vh] flex flex-col p-0"
      >
        <SheetHeader className="shrink-0 px-5 pt-6 pb-3">
          <SheetTitle className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Safety &amp; Privacy
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control who sees you and how your data is used.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">

          {/* Discovery visibility */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Visibility
            </h2>
            <div className="rounded-2xl bg-card shadow-card p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                {isDiscoverable
                  ? <Eye className="h-5 w-5 text-primary" />
                  : <EyeOff className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {isDiscoverable ? "Visible in Discover" : "Hidden from Discover"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {isDiscoverable
                    ? "Others can find and swipe your profile."
                    : "Your profile won't appear in anyone's card stack."}
                </p>
              </div>
              <button
                onClick={handleVisibilityToggle}
                disabled={savingVisibility}
                className={[
                  "relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50",
                  isDiscoverable ? "bg-primary" : "bg-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                    isDiscoverable ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </motion.section>

          {/* Blocking */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Safety
            </h2>
            <button
              disabled
              className="flex w-full items-center gap-4 rounded-2xl bg-card shadow-card p-4 text-left opacity-60 cursor-not-allowed"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Ban className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Blocked profiles</p>
                <p className="text-xs text-muted-foreground mt-0.5">Coming soon</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </motion.section>

          {/* Privacy note */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              How your data is used
            </h2>
            <div className="rounded-2xl bg-card shadow-card p-4 flex gap-3">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your resonance profile is only shown to other users based on your visibility settings.
                Sections you mark as private are never shared publicly. fumbler doesn't sell your data,
                run ads, or share your information with third parties. It's just a weird little app
                built by one person.
              </p>
            </div>
          </motion.section>

          {/* Data & account */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Your data
            </h2>

            <button
              onClick={handleExportData}
              className="flex w-full items-center gap-4 rounded-2xl bg-card shadow-card p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Download className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Export my data</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download everything we have on you</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            <AnimatePresence>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={[
                  "flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all",
                  confirmDelete
                    ? "bg-destructive/10 border border-destructive/40"
                    : "bg-card shadow-card hover:bg-destructive/5",
                ].join(" ")}
              >
                <div className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  confirmDelete ? "bg-destructive/20" : "bg-secondary",
                ].join(" ")}>
                  {confirmDelete
                    ? <AlertTriangle className="h-5 w-5 text-destructive" />
                    : <Trash2 className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={[
                    "text-sm font-semibold transition-colors",
                    confirmDelete ? "text-destructive" : "text-foreground",
                  ].join(" ")}>
                    {deleting
                      ? "Deleting…"
                      : confirmDelete
                      ? "Tap again to confirm"
                      : "Delete account"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {confirmDelete
                      ? "This cannot be undone."
                      : "Removes your profile and signs you out"}
                  </p>
                </div>
              </button>
            </AnimatePresence>
          </motion.section>

        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SafetyPrivacySheet;
